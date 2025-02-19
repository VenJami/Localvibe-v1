import {createReducer} from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  loading: false,
  isLoading: false,
  user: {},
  users: [],
  token: '',
  error: null,
  friendRequests: [],
  acceptedFriends: [],
};

export const userReducer = createReducer(initialState, {

  userRegisterRequest: state => {
    state.loading = true;
    state.isAuthenticated = false;
  },
  userRegisterSuccess: (state, action) => {
    state.loading = false;
    state.isAuthenticated = true;
    state.user = action.payload;
  },
  userRegisterFailed: (state, action) => {
    state.loading = false;
    state.isAuthenticated = false;
    state.error = action.payload;
  },
  userLoadRequest: state => {
    state.loading = true;
    state.isAuthenticated = false;
  },
  userLoadSuccess: (state, action) => {
    state.loading = false;
    state.isAuthenticated = true;
    state.user = action.payload.user;
    state.token = action.payload.token;
  },
  userLoadFailed: (state, action) => {
    state.loading = false;
    state.isAuthenticated = false;
  },
  userLoginRequest: state => {
    state.isAuthenticated = false;
    state.loading = true;
  },
  userLoginSuccess: (state, action) => {
    state.isAuthenticated = true;
    state.loading = false;
    state.user = action.payload;
  },
  userLoginFailed: (state, action) => {
    state.isAuthenticated = false;
    state.loading = false;
    state.error = action.payload;
    state.user = {};
  },
  userLogoutRequest: state => {
    state.loading = true;
  },
  userLogoutSuccess: state => {
    state.loading = false;
    state.isAuthenticated = false;
    state.user = { location: { coordinates: [null, null] } };
  },
  userLogoutFailed: state => {
    state.loading = false;
  },
  getUsersRequest: state => {
    state.isLoading = true;
  },
  getUsersSuccess: (state,action) => {
    state.isLoading = false;
    state.users = action.payload;
  },
  getUsersFailed: (state,action) => {
    state.isLoading = false;
    state.users = action.payload;
  },
  resetPasswordRequest: (state) => {
    state.loading = true;
  },
  resetPasswordSuccess: (state) => {
    state.loading = false;
  },
  resetPasswordFailed: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },
  checkAuthRequest: (state) => {
    state.loading = true;
  },
  checkAuthSuccess: (state, action) => {
    state.loading = false;
    state.isAuthenticated = true;
    state.user = action.payload;
  },
  checkAuthFailed: (state, action) => {
    state.loading = false;
    state.isAuthenticated = false;
    state.error = action.payload;
  },
  verifyEmailRequest: (state) => {
    state.loading = true;
  },
  verifyEmailSuccess: (state) => {
    state.loading = false;
    state.isAuthenticated = true;
  },
  verifyEmailFailed: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },
  clearErrors: state => {
    state.error = null;
    state.isAuthenticated = false;
  },
  
});