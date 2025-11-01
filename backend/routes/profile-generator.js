/**
 * Profile Generator API Routes
 * 
 * Endpoints for generating cannabis-themed usernames and avatars
 */

import express from 'express';
import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdmin.js';
import {
  generateCannabisProfile,
  generateCannabisUsername,
  generateCannabisAvatar,
  generateFarmName,
  generateUniqueUsername,
  getRandomSpecialties,
  getRandomExperienceYears,
  getRandomLocation
} from '../utils/cannabisNameGenerator.js';

const router = express.Router();

/**
 * POST /api/profile-generator/generate
 * Generate a complete cannabis-themed profile
 */
router.post('/generate', async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate base profile
    const profile = generateCannabisProfile(email);
    
    // Make username unique
    const client = supabaseAdmin ?? supabase;
    const uniqueUsername = await generateUniqueUsername(profile.username, client);
    
    // Get random additional data
    const specialties = getRandomSpecialties(uniqueUsername);
    const experienceYears = getRandomExperienceYears(uniqueUsername);
    const location = getRandomLocation(uniqueUsername);

    const completeProfile = {
      ...profile,
      username: uniqueUsername,
      specialties,
      experienceYears,
      city: location.city,
      state: location.state
    };

    // If userId provided, update the profile in database
    if (userId) {
      const { data, error } = await client
        .from('profiles')
        .update({
          username: completeProfile.username,
          display_name: completeProfile.displayName,
          avatar_url: completeProfile.avatarUrl,
          bio: completeProfile.bio,
          grower_farm_name: completeProfile.farmName,
          grower_bio: completeProfile.growerBio,
          grower_specialties: completeProfile.specialties,
          grower_experience_years: completeProfile.experienceYears,
          grower_city: completeProfile.city,
          grower_state: completeProfile.state,
          grower_country: 'USA'
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.json({ success: true, profile: data });
    }

    // Otherwise just return the generated data
    res.json({ success: true, profile: completeProfile });
  } catch (e) {
    console.error('Error generating profile:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/profile-generator/username
 * Generate just a username
 */
router.post('/username', async (req, res) => {
  try {
    const { email } = req.body;
    
    const username = generateCannabisUsername(email);
    const client = supabaseAdmin ?? supabase;
    const uniqueUsername = await generateUniqueUsername(username, client);

    res.json({ username: uniqueUsername });
  } catch (e) {
    console.error('Error generating username:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/profile-generator/avatar
 * Generate just an avatar
 */
router.post('/avatar', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const avatarUrl = generateCannabisAvatar(username);

    res.json({ avatarUrl });
  } catch (e) {
    console.error('Error generating avatar:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /api/profile-generator/regenerate
 * Regenerate username and avatar for existing user
 */
router.post('/regenerate', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const client = supabaseAdmin ?? supabase;

    // Get current profile
    const { data: currentProfile, error: fetchError } = await client
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Generate new profile
    const profile = generateCannabisProfile(currentProfile.email + Date.now()); // Add timestamp for uniqueness
    const uniqueUsername = await generateUniqueUsername(profile.username, client);
    
    // Update profile
    const { data, error } = await client
      .from('profiles')
      .update({
        username: uniqueUsername,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        grower_farm_name: profile.farmName
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, profile: data });
  } catch (e) {
    console.error('Error regenerating profile:', e);
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /api/profile-generator/preview
 * Preview generated profile without saving
 */
router.get('/preview', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const profile = generateCannabisProfile(email);
    const specialties = getRandomSpecialties(profile.username);
    const experienceYears = getRandomExperienceYears(profile.username);
    const location = getRandomLocation(profile.username);

    res.json({
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      farmName: profile.farmName,
      bio: profile.bio,
      growerBio: profile.growerBio,
      specialties,
      experienceYears,
      city: location.city,
      state: location.state
    });
  } catch (e) {
    console.error('Error previewing profile:', e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;

