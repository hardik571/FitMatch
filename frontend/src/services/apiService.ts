import { UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const createUserInBackend = async (name: string, email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create user:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return null;
  }
};

export const getUserFromBackend = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${email}`);

    if (!response.ok) {
      if (response.status !== 404) {
        console.error('Failed to get user:', await response.json());
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return null;
  }
};

export const logUserActivity = async (email: string, activity_type: string, details: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, activity_type, details }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to log activity:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error connecting to backend for logging activity:', error);
    return null;
  }
};
