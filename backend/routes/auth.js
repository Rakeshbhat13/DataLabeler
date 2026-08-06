const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const inMemoryStore = require('../lib/inMemoryStore');

// Register: expects { email, password, role }
router.post('/register', async (req, res) => {
	try {
		console.log('auth/register payload', req.body);
		const { email, password, role } = req.body;
		if (!email || !password || !role) return res.status(400).json({ error: 'email, password and role required' });

		// If mongoose is connected, persist to DB; otherwise use in-memory store
		const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
		console.log('auth/register db connected:', isDbConnected, 'readyState:', mongoose.connection.readyState);
		if (isDbConnected) {
			const existing = await User.findOne({ email });
			if (existing) return res.status(409).json({ error: 'User already exists' });

			const passwordHash = await bcrypt.hash(password, 10);
			const user = new User({ email, passwordHash, role });
			await user.save();
			return res.status(201).json({ message: 'User created' });
		}

		// fallback
		const existing = await inMemoryStore.findByEmail(email);
		console.log('auth/register memory existing:', existing);
		if (existing) return res.status(409).json({ error: 'User already exists (memory)' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await inMemoryStore.createUser({ email, passwordHash, role });
		console.log('auth/register created memory user:', user);
		return res.status(201).json({ message: 'User created (memory)' });
	} catch (err) {
		console.error('auth/register error', err);
		return res.status(500).json({ error: 'Server error' });
	}
});

// Login: expects { email, password }
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ error: 'email and password required' });

		const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
		let user;
		if (isDbConnected) {
			user = await User.findOne({ email });
			if (!user) return res.status(401).json({ error: 'Invalid credentials' });
			const ok = await bcrypt.compare(password, user.passwordHash);
			if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
			const payload = { id: user._id, email: user.email, role: user.role };
			const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
			return res.json({ token, email: user.email, role: user.role });
		}

		// fallback to in-memory
		user = await inMemoryStore.findByEmail(email);
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const ok2 = await bcrypt.compare(password, user.passwordHash);
		if (!ok2) return res.status(401).json({ error: 'Invalid credentials' });
		const payload = { id: user.id, email: user.email, role: user.role };
		const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token, email: user.email, role: user.role });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
});

module.exports = router;
