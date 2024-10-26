const passport = require('passport');
const AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2').Strategy;
const {MultiSamlStrategy} = require('passport-saml/lib/passport-saml/multiSamlStrategy');
const {decodeJwt} = require('../AccessKey/model');
const baseUrl = process.env.AUTH_URL || 'http://localhost:1337';
const axios = require('axios');
const applicationId = process.env.applicationId || 1;
const applicationKeyHeaders = {
	'x-application-key': process.env.APPLICATION_KEY || '',
	'x-application-secret': process.env.APPLICATION_SECRET || '',
};
const {db, StorageService: Storage, AuthenticationError} = require('../../utility/common/common');
const samlBucket = process.env.SSO_CERTIFICATE_BUCKET || 'dev-upsiide-saml-certs';
const storageService = new Storage(samlBucket, false, process.env.S3_ACCESS_KEY, process.env.S3_SECRET);

passport.serializeUser(function(user, done) {
	done(null, []);
});

passport.deserializeUser(function(user, done) {
	done(null, []);
});

passport.use(
	new AzureAdOAuth2Strategy(
		{
			clientID: process.env.MICROSOFT_SSO_CLIENTID,
			clientSecret: process.env.MICROSOFT_SSO_SECRET,
			callbackURL: process.env.MICROSOFT_SSO_CALLBACKURL,
		},
		async (accessToken, refreshToken, params, profile, done) => {
			try {
				// API Call to auth to confirm user
				if (!params.id_token) throw new AuthenticationError('INVALID_JWT');
				const jwt = decodeJwt(params.id_token);

				const result = await axios.post(baseUrl + '/public/application/login', {...jwt, applicationId}, {
					headers: {
						...applicationKeyHeaders,
					},
				})
					.catch((e) => {
						console.error(e);
					});

				return done(null, result.data);
			} catch (e) {
				console.error(e);
			}
		}
	)
);

passport.use(new MultiSamlStrategy(
	{
		passReqToCallback: true, // makes req available in callback
		getSamlOptions: async (req, done) => {
			try {
				const {samlUuid} = req.params;
				if (!samlUuid) done(new AuthenticationError('INVALID_SAML_UUID'), null);

				const query = db
					.select()
					.all()
					.from('AccountSettings', 'ACS')
					.join('Accounts', 'A')
					.on('ACS.accountId=A.id')
					.where({
						'ACS.samlUuid': samlUuid,
					});

				const [settings] = await db.run(query);
				if (!settings) done(new AuthenticationError('INVALID_ACCOUNT'), null);

				// Fetch account
				req.clientUuid = settings.ownerUuid;
				req.samlConfig = JSON.parse(settings.samlUserConfig);
				req.roleId = settings.samlRoleId || process.env.DEFAULT_SAML_ROLE || null;

				let item = undefined;
				if (settings.samlCertPath) {
					item = await storageService.read(settings.samlCertPath);
				}

				const API_URL = process.env.SSO_API_URL || 'https://sso.upsiide.com';
				const callbackUrl = `${API_URL}/auth/saml/${settings.samlUuid}/callback`;

				done(null,
					{
						path: settings.samlPath,
						// eslint-disable-next-line
						callbackUrl,
						entryPoint: settings.samlEntryPoint,
						issuer: settings.samlIssuer,
						...(item != undefined) ? {cert: item.toString()} : {},
						disableRequestedAuthnContext: true,
					});
			} catch (e) {
				console.log('unexpected saml error in processing settings:>> ', e);
				done(e, null);
			}
		},
	},
	async (req, profile, done, err) => {
		try {
			if (err) {
				console.log('error after fetching saml settings :>> ', err);
				done(err, null);
			}

			const clientUuid = req.clientUuid;
			const roleId = req.roleId;
			const config = req.samlConfig;
			const userMeta = [];

			if (config.meta && config.meta.length) {
				for (const meta of config.meta) {
					userMeta.push({
						label: meta,
						value: (typeof profile[meta] === 'string') ? profile[meta] : JSON.stringify(profile[meta]),
					});
				}
			}

			if (process.env.NODE_ENV !== 'production' || process.env.LOG_SAML_PROFILE === 'true') {
				console.log('profile :>> ', profile);
			}

			const user = {
				firstName: profile[config.firstName] || null,
				lastName: profile[config.lastName] || null,
				email: profile[config.email],
				...(config.meta && config.meta.length) ? {metadata: userMeta} : undefined,
				clientUuid,
				roleId,
			};

			const result = await axios.post(baseUrl + '/public/saml/login', {...user, applicationId}, {
				headers: {
					...applicationKeyHeaders,
				},
			});

			done(null, result.data);
		} catch (e) {
			console.log('unexpected error in handling saml user data :>> ', e);
			done(e, null);
		}
	})
);
