import { useMutation, useQuery } from '@tanstack/react-query';
import { AuthService, AuthCredentials, RegisterCredentials } from '../services/authService';
import { useAuthStore } from '../../../lib/store/auth';

export const useAuth = () => {
  const { user, setUser, clearAuth } = useAuthStore();

  const signInMutation = useMutation({
    mutationFn: (credentials: AuthCredentials) => AuthService.signIn(credentials),
    onSuccess: async () => {
      // User will be set via AuthProvider's auth state listener
    },
    onError: (error) => {
      console.error('Sign in error:', error);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => AuthService.signUp(credentials),
    onSuccess: () => {
      // User will be set via AuthProvider's auth state listener
    },
    onError: (error) => {
      console.error('Sign up error:', error);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => AuthService.signOut(),
    onSuccess: () => {
      clearAuth();
    },
    onError: (error) => {
      console.error('Sign out error:', error);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => AuthService.resetPassword(email),
    onError: (error) => {
      console.error('Reset password error:', error);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Parameters<typeof AuthService.updateProfile>[0]) => 
      AuthService.updateProfile(updates),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
    onError: (error) => {
      console.error('Update profile error:', error);
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    isLoading: signInMutation.isPending || 
               signUpMutation.isPending || 
               signOutMutation.isPending ||
               resetPasswordMutation.isPending ||
               updateProfileMutation.isPending,
    error: signInMutation.error || 
           signUpMutation.error || 
           signOutMutation.error ||
           resetPasswordMutation.error ||
           updateProfileMutation.error,
  };
};