import { Router } from 'express';
import { searchEmails, getAccounts, suggestReply } from '../controllers/emailController';

const router = Router();

router.get('/accounts', getAccounts);
router.get('/emails', searchEmails);
router.post('/emails/:id/suggest-reply', suggestReply);

export default router;
