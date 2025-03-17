import axios from 'axios';
import {URI} from '../URI';
import {Dispatch} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create or update a report

export const createOrUpdateReportAction =
(
  userId: string,
  reportedItemId: string,
  reportTitle: string,
  reportImage: string,
  itemType: string,
  reason: string,
) =>
  async (dispatch: Dispatch<any>) => {
    try {
      console.log('Dispatching createOrUpdateReportAction...');

      dispatch({
        type: 'createOrUpdateReportRequest',
      });

      const token = await AsyncStorage.getItem('token');
      console.log('Token fetched:', token);

      console.log('Payload being sent:', {
        userId,
        reportedItemId,
        reportTitle,
        reportImage,
        itemType,
        reason,
      });

      const { data } = await axios.post(
        `${URI}/create-or-update-report`,
        { userId, reportedItemId, reportTitle, reportImage, itemType, reason }, // Change reportImage to imageUrl
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('API Response:', data);

      dispatch({
        type: 'createOrUpdateReportSuccess',
        payload: data,
      });
    } catch (error: any) {
      console.error('Error in createOrUpdateReportAction:', error.message);

      dispatch({
        type: 'createOrUpdateReportFailed',
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Get all reports
export const getAllReportsAction = () => async (dispatch: Dispatch<any>) => {
  try {
    console.log('Dispatching getAllReportsAction...'); // Debugging log

    dispatch({
      type: 'getAllReportsRequest',
    });

    const token = await AsyncStorage.getItem('token');
    console.log('Token fetched:', token); // Debugging log

    const {data} = await axios.get(`${URI}/get-all-reports`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('API Response:', data); // Debugging log

    dispatch({
      type: 'getAllReportsSuccess',
      payload: data.reports,
    });
  } catch (error: any) {
    console.error('Error in getAllReportsAction:', error.message); // Debugging log

    dispatch({
      type: 'getAllReportsFailed',
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Get reports for a specific item
export const getReportsByItemAction =
  (reportedItemId: string, itemType: string) =>
  async (dispatch: Dispatch<any>) => {
    try {
      console.log('Dispatching getReportsByItemAction...'); // Debugging log
      console.log('Params:', {reportedItemId, itemType}); // Debugging log

      dispatch({
        type: 'getReportsByItemRequest',
      });

      const token = await AsyncStorage.getItem('token');
      console.log('Token fetched:', token); // Debugging log

      const {data} = await axios.get(
        `${URI}/get-reports-by-item/${reportedItemId}/${itemType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('API Response:', data); // Debugging log

      dispatch({
        type: 'getReportsByItemSuccess',
        payload: data.reports,
      });
    } catch (error: any) {
      console.error('Error in getReportsByItemAction:', error.message); // Debugging log

      dispatch({
        type: 'getReportsByItemFailed',
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Delete a report by ID
export const deleteReportAction =
  (reportId: string) => async (dispatch: Dispatch<any>) => {
    try {
      console.log('Dispatching deleteReportAction...'); // Debugging log
      console.log('Report ID:', reportId); // Debugging log

      dispatch({
        type: 'deleteReportRequest',
      });

      const token = await AsyncStorage.getItem('token');
      console.log('Token fetched:', token); // Debugging log

      const {data} = await axios.delete(`${URI}/delete-report/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response:', data); // Debugging log

      dispatch({
        type: 'deleteReportSuccess',
        payload: data,
      });
    } catch (error: any) {
      console.error('Error in deleteReportAction:', error.message); // Debugging log

      dispatch({
        type: 'deleteReportFailed',
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// Delete all reports for a specific item
export const deleteReportsByItemAction =
  (reportedItemId: string, itemType: string) =>
  async (dispatch: Dispatch<any>) => {
    try {
      console.log('Dispatching deleteReportsByItemAction...'); // Debugging log
      console.log('Params:', {reportedItemId, itemType}); // Debugging log

      dispatch({
        type: 'deleteReportsByItemRequest',
      });

      const token = await AsyncStorage.getItem('token');
      console.log('Token fetched:', token); // Debugging log

      const {data} = await axios.delete(
        `${URI}/delete-reports-by-item/${reportedItemId}/${itemType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('API Response:', data); // Debugging log

      dispatch({
        type: 'deleteReportsByItemSuccess',
        payload: data,
      });
    } catch (error: any) {
      console.error('Error in deleteReportsByItemAction:', error.message); // Debugging log

      dispatch({
        type: 'deleteReportsByItemFailed',
        payload: error.response?.data?.message || error.message,
      });
    }
  };
