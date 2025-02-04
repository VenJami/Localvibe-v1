import axios from 'axios';
import {URI} from '../URI';
import {Dispatch} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const updateInteraction =
  (postId: string, user: any) =>
  async (dispatch: (arg0: {type: string; payload: any}) => void) => {
    try {
      // Send the updated user interactions to the backend
      const token = await AsyncStorage.getItem('token');
      console.log('Sending data to server:', {
        postId,
        score: 1,
      });
      const response = await axios.put(
        `${URI}/update-interactions`,
        {
          postId,
          score: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Handle the response from the server
      if (response.data.success) {
        // If interactions were successfully updated on the server, you can optionally dispatch another action or update the state as needed
        console.log('Interactions updated successfully');
        dispatch({
          type: 'updateInteractionsSuccess',
          payload: response.data.updatedInteractions, // Assuming the server sends back the updated interactions
        });
      } else {
        // Handle any potential errors or edge cases
        console.error('Failed to update interactions:', response.data.message);
      }
    } catch (error) {
      console.log(error, 'errorrrrrr');
      // Handle any errors that occur during the update process
    }
  };
export const removeInteraction =
  (postId: string, user: any) =>
  async (dispatch: (arg0: {type: string; payload: any}) => void) => {
    try {
      console.log('removeInteraction');

      // Send the updated user interactions to the backend
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${URI}/remove-interactions`,
        {postId, score: 1},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Handle the response from the server
      if (response.data.success) {
        // If interactions were successfully updated on the server, you can optionally dispatch another action or update the state as needed
        console.log('Interactions removed successfully');
        dispatch({
          type: 'removeInteractionsSuccess',
          payload: response.data.updatedInteractions, // Assuming the server sends back the updated interactions
        });
      } else {
        // Handle any potential errors or edge cases
        console.error('Failed to remove interactions:', response.data.message);
      }
    } catch (error) {
      console.log(error, 'errorrrrrr');
      // Handle any errors that occur during the update process
    }
  };

// register user
export const registerUser =
  (
    name: string,
    email: string,
    password: string,
    avatar: string,
    accountType: string,
  ) =>
  async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'userRegisterRequest',
      });

      const config = {headers: {'Content-Type': 'application/json'}};
      const {data} = await axios.post(
        `${URI}/registration`,
        {name, email, password, avatar, accountType},
        config,
      );
      dispatch({
        type: 'userRegisterSuccess',
        payload: data.user,
      });
      await AsyncStorage.setItem('token', data.token);
    } catch (error: any) {
      dispatch({
        type: 'userRegisterFailed',
        payload: error.response.data.message,
      });
    }
  };

// load user
export const loadUser = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'userLoadRequest',
    });

    const token = await AsyncStorage.getItem('token');

    const {data} = await axios.get(`${URI}/me`, {
      headers: {Authorization: `Bearer ${token}`},
    });

    dispatch({
      type: 'userLoadSuccess',
      payload: {
        user: data.user,
        token,
      },
    });
  } catch (error: any) {
    dispatch({
      type: 'userLoadFailed',
      payload: error.response.data.message,
    });
  }
};

// login user
export const loginUser =
  (email: string, password: string) => async (dispatch: Dispatch<any>) => {
    try {
      dispatch({
        type: 'userLoginRequest',
      });

      const config = {headers: {'Content-Type': 'application/json'}};

      const {data} = await axios.post(
        `${URI}/login`,
        {email, password},
        config,
      );
      dispatch({
        type: 'userLoginSuccess',
        payload: data.user,
      });
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }
    } catch (error: any) {
      dispatch({
        type: 'userLoginFailed',
        payload: error.response.data.message,
      });
    }
  };

// log out user
export const logoutUser = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'userLogoutRequest',
    });

    await AsyncStorage.setItem('token', '');

    dispatch({
      type: 'userLogoutSuccess',
      payload: {},
    });
  } catch (error) {
    dispatch({
      type: 'userLogoutFailed',
    });
  }
};

// get all users
export const getAllUsers = () => async (dispatch: Dispatch<any>) => {
  try {
    dispatch({
      type: 'getUsersRequest',
    });

    const token = await AsyncStorage.getItem('token');

    const {data} = await axios.get(`${URI}/users`, {
      headers: {Authorization: `Bearer ${token}`},
    });

    dispatch({
      type: 'getUsersSuccess',
      payload: data.users,
    });
  } catch (error: any) {
    dispatch({
      type: 'getUsersFailed',
      payload: error.response.data.message,
    });
  }
};

interface FollowUnfollowParams {
  userId: string;
  followUserId: string;
  users: any;
}

// follow user
export const followUserAction =
  ({userId, users, followUserId}: FollowUnfollowParams) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const updatedUsers = users.map((userObj: any) =>
        userObj._id === followUserId
          ? {
              ...userObj,
              followers: [...userObj.followers, {userId}],
            }
          : userObj,
      );

      // update our users state
      dispatch({
        type: 'getUsersSuccess',
        payload: updatedUsers,
      });

      await axios.put(
        `${URI}/add-user`,
        {followUserId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.log('Error following user:', error);
    }
  };

// unfollow user
export const unfollowUserAction =
  ({userId, users, followUserId}: FollowUnfollowParams) =>
  async (dispatch: Dispatch<any>) => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Remove follower locally
      const updatedUsers = users.map((userObj: any) =>
        userObj._id === followUserId
          ? {
              ...userObj,
              followers: userObj.followers.filter(
                (follower: any) => follower.userId !== userId,
              ),
            }
          : userObj,
      );

      // Dispatch the updated users list to the store (locally updated)
      dispatch({
        type: 'getUsersSuccess',
        payload: updatedUsers,
      });

      // Now make the API call to update the backend
      await axios.put(
        `${URI}/remove-follower`, // Ensure this endpoint removes the follower correctly
        {userId, followUserId},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.log('Error unfollowing user:', error);
    }
  };

