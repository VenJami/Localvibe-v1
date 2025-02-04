import {createReducer} from '@reduxjs/toolkit';

const initialState = {
  pins: [],
  pin: {},
  reviews: [], // New state to store reviews for a specific pin
  error: null,
  isSuccess: false,
  isLoading: true,
};

export const pinReducer = createReducer(initialState, {
  // Pin actions
  pinCreateRequest: state => {
    state.isLoading = true;
  },
  pinCreateSuccess: (state, action) => {
    state.isLoading = false;
    state.pin = action.payload;
    state.isSuccess = true;
  },
  pinCreateFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },
  getAllPinsRequest: state => {
    state.isLoading = true;
  },
  getAllPinsSuccess: (state, action) => {
    state.isLoading = false;
    state.pins = action.payload;
  },
  getAllPinsFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },

  // Review actions
  addReviewRequest: state => {
    state.isLoading = true;
  },
  addReviewSuccess: (state, action) => {
    state.isLoading = false;
    state.reviews.push(action.payload); // Add new review to the reviews array
    state.isSuccess = true;
  },
  addReviewFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },
  getReviewsRequest: state => {
    state.isLoading = true;
  },
  getReviewsSuccess: (state, action) => {
    state.isLoading = false;
    state.reviews = action.payload; // Store reviews for a specific pin
  },
  getReviewsFailed: (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  },
  updateReviewRequest: state => {
    state.isLoading = true;
  },
  // Clear errors
  clearErrors: state => {
    state.error = null;
  },
});

export default pinReducer;
