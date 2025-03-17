/* eslint-disable prettier/prettier */
import {
  Alert,
  Image,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';

import {Picker} from '@react-native-picker/picker';

type Props = {
  navigation: any;
  route: any;
};

const SignupScreen = ({navigation}: Props) => {
  const backgroundImage = require('../assets/2ndbackground.png');
  const logo = require('../assets/logo.png');

  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState('');


  const [accountType, setAccountType] = useState('personal');
  const isDisabled = !firstName || !lastName || !name || !avatar;

  const uploadImage = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: true,
    })
      .then((image: ImageOrVideo | null) => {
        if (image) {
          setAvatar('data:image/jpeg;base64,' + image.data);
        } else {
          Alert.alert('No image selected');
        }
      })
      .catch(error => {
        console.error('Image picking error:', error);
      });
  };

  const submitHandler = () => {
    const userInfo = {
      name,
      avatar,
      accountType,
    };
    navigation.navigate('Signup', userInfo);
  };

  return (
      <View style={styles.container}>
        <Image style={styles.backgroundImage} source={backgroundImage} />
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={logo} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.formContainer}>
            <View style={styles.profileContainer}>
              <View style={styles.profileDetails}>
                <Text style={styles.heading}>Setting up profile</Text>
                <Text style={styles.subheading}>Join to explore!</Text>
              </View>

              <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
                <Image
                  style={styles.avatar}
                  source={{
                    uri: avatar
                      ? avatar
                      : 'https://cdn-icons-png.flaticon.com/512/8801/8801434.png',
                  }}
                />
                <Text style={styles.uploadText} onPress={uploadImage}>
                  Upload Profile Icon
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={text => setFirstName(text)}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={text => setLastName(text)}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  placeholder="Username"
                  value={name}
                  onChangeText={text => setName(text)}
                  style={styles.input}
                />
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    prompt="Select an account type"
                    selectedValue={accountType}
                    onValueChange={itemValue => setAccountType(itemValue)}
                    style={styles.picker}>
                    <Picker.Item label="Personal" value="personal" />
                    <Picker.Item label="Business" value="business" />
                  </Picker>
                </View>
              </View>
            </View>

          <TouchableOpacity
            onPress={submitHandler}
            style={[styles.submitButton, isDisabled && styles.disabledButton]}
            disabled={isDisabled}
          >
            <Text style={styles.submitButtonText}>Register</Text>
          </TouchableOpacity>

          <View style={{width: '100%', marginTop: 10,}}>
            <TouchableOpacity style={{
              alignItems: 'center', elevation: 5, shadowColor: '#000', borderColor: '#ccc', borderWidth: 1, borderRadius: 10,
}} onPress={() => navigation.goBack()}>
              <View style={styles.signInButton}>
                <Text style={styles.signInText}>Back</Text>
              </View>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  signInButton: {
    height: 39,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  signInText: {
    color: '#2f855a',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Roboto',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1FFF8',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 1050,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '15%',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    marginTop: '18%',
    width: 175,
    height: 175,
  },
  formContainer: {
    width: '90%',
    alignItems: 'flex-start',
    marginTop: 30,
  },
  profileContainer: {
    width: '100%',
    justifyContent: 'space-around',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  heading: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  subheading: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Roboto',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderColor: '#B0B0B0',
    borderWidth: 1,
    padding: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  uploadText: {
    fontSize: 15,
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    marginTop: 5,
  },

  addressContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginVertical: 10,
  },
  inputContainer: {
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginVertical: 2,
  },
  inputWrapper: {
    marginBottom: 10,
    width: '48%',
  },
  addressWrapper: {
    marginBottom: 10,
    width: '100%',
  },
  inputLabel: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    elevation: 3,
  },
  pickerContainer: {
    width: '48%',
  },
  pickerWrapper: {
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: '#FFFFFF',
    height: 40,
    borderRadius: 10,
    elevation: 3,
  },
  picker: {
    width: '100%',
  },
  termsText: {
    fontSize: 11,
    fontFamily: 'Roboto',
  },
  linkText: {
    color: 'green',
    fontWeight: 'bold',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#017E5E',
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    marginTop: 15,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  termContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
});

export default SignupScreen;
