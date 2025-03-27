import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { URI } from '../../redux/URI';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VerificationScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(60);
  const { user, token, users } = useSelector((state: any) => state.user);

  useEffect(() => {
    let interval;
    if (resendDisabled) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendDisabled]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${URI}/verify-email`, { code });
      Alert.alert('Success', response.data.message);
      await AsyncStorage.setItem('isEmailVerified', 'true');
      navigation.navigate('Home');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResendDisabled(true);
    try {
      await axios.post(`${URI}/resend-code`);
      Alert.alert('Success', 'A new verification code has been sent to your email.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend code');
      setResendDisabled(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Enter Verification Code
      </Text>
      <Text style={{ color: 'gray', marginBottom: 10 }}>
        We've sent a 6-digit code to your email.
      </Text>

      <TextInput
        style={{
          width: '80%',
          height: 50,
          borderWidth: 1,
          borderColor: '#ccc',
          textAlign: 'center',
          fontSize: 18,
          borderRadius: 5,
          marginBottom: 20,
          letterSpacing: 10,
        }}
        maxLength={6}
        keyboardType="numeric"
        value={code}
        onChangeText={setCode}
      />

      {error ? (
        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleVerify}
        style={{
          backgroundColor: '#007BFF',
          padding: 12,
          borderRadius: 5,
          width: '80%',
          alignItems: 'center',
          marginBottom: 10,
        }}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16 }}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        style={{
          backgroundColor: resendDisabled ? '#ccc' : '#28A745',
          padding: 12,
          borderRadius: 5,
          width: '80%',
          alignItems: 'center',
        }}
        disabled={resendDisabled}>
        <Text style={{ color: '#fff', fontSize: 16 }}>
          {resendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerificationScreen;
