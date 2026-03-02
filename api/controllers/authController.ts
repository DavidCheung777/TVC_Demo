import { type Request, type Response } from 'express';
import { db } from '../services/db.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: req.t('common.missingParams') });
    return;
  }

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      user: data.user,
      token: data.session.access_token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};
