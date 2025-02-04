import axios from 'axios';
import {URI} from '../URI';
import {Dispatch} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// create pin
export const createPinAction =
  (
    createdBy: object,
    businessName: string,
    description: string,
    category: string,
    latitude: number,
    longitude: number,
    contactInfo: {phone?: string; email?: string; website?: string},
    image: string,
    operatingHours: {
      monday: {open: string; close: string};
      tuesday: {open: string; close: string} /*...*/;
    }, // Correct field name
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      console.log('Creating pin with the following details:');
      console.log('Created By:', createdBy);
      console.log('Business Name:', businessName);
      console.log('Description:', description);
      console.log('Category:', category);
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
      console.log('Contact Info:', contactInfo);
      console.log('Image:', image);
      console.log('Operating Hours:', operatingHours); // Correct field to log

      dispatch({
        type: 'pinCreateRequest',
      });

      const token = await AsyncStorage.getItem('token');

      const {data} = await axios.post(
        `${URI}/create-pin`,
        {
          createdBy,
          businessName,
          description,
          category,
          latitude,
          longitude,
          contactInfo,
          image,
          operatingHours, // Send the correct operatingHours here
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch({
        type: 'pinCreateSuccess',
        payload: data.pin,
      });
    } catch (error: any) {
      dispatch({
        type: 'pinCreateFailed',
        payload: error.response.data.message,
      });
    }
  };


export const modifyPinAction =
  (
    pinId: string,
    businessName: string,
    description: string,
    category: string,
    latitude: number,
    longitude: number,
    contactInfo: {phone?: string; email?: string; website?: string},
    image: string,
    openingHours: string, // Add openingHours here
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'pinModifyRequest',
      });

      const token = await AsyncStorage.getItem('token');
      console.log('Token Retrieved:', token);

      const requestData = {
        businessName,
        description,
        category,
        latitude,
        longitude,
        contactInfo,
        image,
        openingHours,
      };

      console.log('Sending Request to Update Pin:', requestData);

      const {data} = await axios.put(
        `${URI}/update-pin/${pinId}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Server Response:', data);

      dispatch({
        type: 'pinModifySuccess',
        payload: data.pin,
      });

      console.log('Dispatch Success: Pin updated successfully');
    } catch (error: any) {
      console.error(
        'Error Updating Pin:',
        error.response?.data || error.message,
      );

      dispatch({
        type: 'pinModifyFailed',
        payload: error.response?.data?.message || 'Unknown error occurred',
      });
    }
  };


// get all pins
export const getAllPins = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'getAllPinsRequest',
    });

    const token = await AsyncStorage.getItem('token');

    const {data} = await axios.get(`${URI}/get-all-pins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch({
      type: 'getAllPinsSuccess',
      payload: data.pins,
    });
  } catch (error: any) {
    dispatch({
      type: 'getAllPinsFailed',
      payload: error.response.data.message,
    });
  }
};

export const deletePinAction =
  (pinId: string) => async (dispatch: Dispatch<any>) => {
    console.log('trying to delete pin');

    try {
      dispatch({
        type: 'pinDeleteRequest',
      });

      const token = await AsyncStorage.getItem('token');

      await axios.delete(`${URI}/delete-pin/${pinId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch({
        type: 'pinDeleteSuccess',
        payload: pinId,
      });
    } catch (error: any) {
      dispatch({
        type: 'pinDeleteFailed',
        payload: error.response.data.message,
      });
    }
  };

export const addReviewAction =
  (
    pinId: string,
    reviewData: {
      userId: string;
      name: string;
      image: string;
      reviewText: string;
      ratings: number;
    },
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'addReviewRequest',
      });

      // Log the data being sent to the server
      console.log('Data being sent to add review:');
      console.log('Pin ID:', pinId);
      console.log('User ID:', reviewData.userId); // Log userId
      console.log('Name:', reviewData.name); // Log user's name
      console.log('Avatar:', reviewData.image); // Log user's avatar URL
      console.log('Review Text:', reviewData.reviewText);
      console.log('Ratings:', reviewData.ratings);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      console.log('Token:', token); // Log the token

      const {data} = await axios.post(
        `${URI}/add-review`,
        {
          pinId,
          userId: reviewData.userId, // Use userId from reviewData
          name: reviewData.name, // Use name from reviewData
          image: reviewData.image, // Use avatar image URL
          reviewText: reviewData.reviewText,
          ratings: reviewData.ratings,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch({
        type: 'addReviewSuccess',
        payload: data.pin, // Updated pin with the new review
      });
    } catch (error: any) {
      console.error('Error in addReviewAction:', error); // Log the error
      dispatch({
        type: 'addReviewFailed',
        payload: error.response.data.message,
      });
    }
  };

// Modify Review
export const modifyReviewAction =
  (
    pinId: string,
    reviewId: string,
    reviewData: {
      userId: string;
      name: string;
      image: string;
      reviewText: string;
      ratings: number;
    },
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'modifyReviewRequest',
      });

      const token = await AsyncStorage.getItem('token');

      const {data} = await axios.put(
        `${URI}/modify-review`,
        {
          pinId,
          reviewId,
          userId: reviewData.userId, // Use userId from reviewData
          name: reviewData.name, // Use name from reviewData
          image: reviewData.image, // Use avatar image URL
          reviewText: reviewData.reviewText,
          ratings: reviewData.ratings,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch({
        type: 'modifyReviewSuccess',
        payload: data.pin, // Updated pin with the modified review
      });
    } catch (error: any) {
      dispatch({
        type: 'modifyReviewFailed',
        payload: error.response.data.message,
      });
    }
  };

// Delete Review
export const deleteReviewAction =
  (
    pinId: string,
    reviewId: string,
    reviewData: {userId: string; name: string; image: string},
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      console.log('Delete Review Action initiated with:', {
        pinId,
        reviewId,
        userId: reviewData.userId, // Log userId
        name: reviewData.name, // Log name
        image: reviewData.image, // Log avatar image URL
      });

      dispatch({
        type: 'deleteReviewRequest',
      });

      const token = await AsyncStorage.getItem('token');
      console.log('Retrieved token:', token); // Log token retrieval

      const {data} = await axios.delete(`${URI}/delete-review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          pinId, // Pin ID to delete the review from
          reviewId, // Review ID to be deleted
          userId: reviewData.userId, // User ID of the person deleting the review
          name: reviewData.name, // User's name
          image: reviewData.image, // User's avatar image URL
        },
      });

      console.log('Delete review response data:', data); // Log server response

      dispatch({
        type: 'deleteReviewSuccess',
        payload: data.pin, // Updated pin data after review deletion
      });
    } catch (error: any) {
      console.log(
        'Error during deleteReviewAction:',
        error.response?.data?.message || error.message,
      ); // Log error message
      dispatch({
        type: 'deleteReviewFailed',
        payload:
          error.response?.data?.message || 'An unexpected error occurred.',
      });
    }
  };

// Increment Visit Count

// Add Visit Action
export const addVisitorAction =
  (pinId: string, userId: string) => async (dispatch: Dispatch<any>) => {
    try {
      console.log('Adding visitor with details:', {pinId, userId}); // Log inputs

      dispatch({
        type: 'addVisitorRequest',
      });

      const token = await AsyncStorage.getItem('token');
      console.log('Retrieved token:', token); // Log token retrieval

      const {data} = await axios.post(
        `${URI}/add-visitor`,
        {
          pinId,
          userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Add visitor response:', data); // Log server response

      dispatch({
        type: 'addVisitorSuccess',
        payload: {pinId, visitors: data.visitors}, // Updated visitors list
      });
    } catch (error: any) {
      console.error(
        'Error during addVisitorAction:',
        error.response?.data?.message || error.message,
      ); // Log error message
      dispatch({
        type: 'addVisitorFailed',
        payload:
          error.response?.data?.message || 'An unexpected error occurred.',
      });
    }
  };
// Get Pin by ID Action
export const getPinByIdAction =
  (pinId: string) =>
  async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'getPinByIdRequest',
      });

      const token = await AsyncStorage.getItem('token');

      const {data} = await axios.get(`${URI}/get-pin/${pinId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch({
        type: 'getPinByIdSuccess',
        payload: data.pin,
      });
    } catch (error: any) {
      dispatch({
        type: 'getPinByIdFailed',
        payload: error.response.data.message,
      });
    }
  };
