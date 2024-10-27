'use strict';

import { Router } from 'express';
import { createProject, getProjects } from './controller';

const router = Router();

router.route('/').get(getProjects).post(createProject);

export default router;
