/* eslint-disable prettier/prettier */
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  Modal,  
  ScrollView,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import CheckBox from '@react-native-community/checkbox';
import { registerUser } from '../../redux/actions/userAction';
import { useDispatch, useSelector } from 'react-redux';

type Props = {
  navigation: any;
};

const SignupScreen = ({navigation, route}: Props) => {
  const backgroundImage = require('../assets/background.png');
  const logo = require('../assets/logo.png');
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [accountType, setAccountType] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {error, isAuthenticated} = useSelector((state: any) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  useEffect(() => {
    if (password && confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    } else {
      setPasswordMatch(true); // No validation required when both fields are empty
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    if (route.params) {
      const { name, avatar, accountType, email, password } = route.params;
      if (name) setName(name);
      if (avatar) setAvatar(avatar);
      if (accountType) setAccountType(accountType);
      if (email) setEmail(email);
      if (password) setPassword(password);
    }
  }, [route.params]);

  const dispatch = useDispatch();

  const handleTermsPress = () => {
    setIsModalVisible(true); 
  };

  const handleModalClose = () => {
    setIsModalVisible(false); // Close the modal
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Regex to check password strength: 8+ characters, special characters
  const passwordRegex = /^(?=.*[!@#$%^&*])(?=.{8,})/;

  const validatePassword = () => {
    if (!passwordRegex.test(password)) {
      setModalMessage('Password must be at least 8 characters long and contain a special character.');
      setModalVisible(true);
      return false;
    }
    if (password !== confirmPassword) {
      setModalMessage('Password do not match.');
      setModalVisible(true);
      return false;
    }
    return true;
  };

  const handleSignUpPress = async () => {
    try {
      if (!validateEmail(email)) {
        setModalMessage('Invalid email format.');
        setModalVisible(true);
        return;
      }

      if (!validatePassword()) {
        return;
      }

      await registerUser(name, email, password, avatar, accountType)(dispatch);
      setModalMessage('Registration Successful!');
      setModalVisible(true);
    } catch (error) {
      console.error('An error occurred:', error);
      setModalMessage('An error occurred while processing your request.');
      setModalVisible(true);
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert(error);
    }
    if (isAuthenticated) {
      Alert.alert('Account Creation Successful!');
      navigation.navigate('VerifyEmail');
    }
  }, [error, isAuthenticated, navigation]);

  
  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <Image style={styles.backgroundImage} source={backgroundImage} />
      <View style={styles.body}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={logo} />
        </View>
        <View style={styles.gettingStarterBlock}>
          <View style={styles.forms}>
            <View style={styles.loginBlock}>
              <View style={styles.gettingStarted}>
                <Text style={styles.gettingStartedText}>Join LocalVibe</Text>
                <Text style={styles.joinToExploreText}>Join to explore!</Text>
              </View>
              <View style={styles.loginPass}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email or Phone Number</Text>
                  <TextInput
                    placeholder="Email or Phone Number"
                    value={email}
                    onChangeText={text => setEmail(text)}
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.input}>
                    <TextInput
                      style={{width: '85%',}}
                      placeholder="Password"
                      value={password}
                      onChangeText={text => setPassword(text)}
                      secureTextEntry={!showPassword}
                    />
                   <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Image 
                      style={styles.eyePassword} 
                      source={showPassword ? require('../assets/eyeOpen.png') : require('../assets/eyeClose.png')} />
                   </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.input}>
                    <TextInput
                      style={{ width: '85%', }}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChangeText={text => setConfirmPassword(text)}
                      secureTextEntry={!showConfirmPassword}
                    />
                    
                    <TouchableOpacity onPress={()=> setShowConfirmPassword(!showConfirmPassword)}>
                      <Image style={styles.eyePassword} source={showConfirmPassword ? require('../assets/eyeOpen.png') : require('../assets/eyeClose.png')}/>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ width: '100%'}}>
                  <Text style={{ color: passwordMatch === null || passwordMatch ? '#017E5E' : '#f44336', textAlign: 'right' }}>
                    {password && confirmPassword ? (passwordMatch ? 'Passwords match' : 'Password do not match') : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.termsMainContainer}>
            <View style={styles.termsContainer}>
              <Text style={styles.normalText}>Agree to </Text>
              <TouchableOpacity onPress={handleTermsPress}>
                <Text style={styles.termsText}>Terms and Conditions</Text>
              </TouchableOpacity>

              <CheckBox
                value={isChecked}
                onValueChange={setIsChecked}
                style={styles.checkbox}
              />
            </View>
          </View>

          <Modal
            transparent={true}
            visible={isModalVisible}
            animationType="slide"
            onRequestClose={handleModalClose}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalWrapper}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                  <Text style={styles.modalHeader}>Terms and Conditions</Text>

                  <Text style={styles.modalTextTitle}>
                    1. Acceptance of Terms
                  </Text>
                  <Text style={styles.modalText}>
                    By creating an account, accessing, or using LocalVibe, you
                    agree to abide by these Terms, our Privacy Policy, and any
                    additional guidelines or future modifications.
                  </Text>

                  <Text style={styles.modalTextTitle}>
                    2. Use of the Service
                  </Text>
                  <Text style={styles.modalText}>
                    • Eligibility: You must be at least 13 years old to use
                    LocalVibe.
                  </Text>
                  <Text style={styles.modalText}>
                    • License: LocalVibe grants you a limited, non-transferable,
                    and non-exclusive license to use the app for personal,
                    non-commercial use.
                  </Text>
                  <Text style={styles.modalText}>
                    • Account Security: You are responsible for maintaining the
                    confidentiality of your account login credentials and are
                    liable for any activities conducted under your account.
                  </Text>

                  <Text style={styles.modalTextTitle}>3. User Conduct</Text>
                  <Text style={styles.modalText}>
                    • Community Guidelines: When using LocalVibe, you agree to
                    respect other users and engage positively with the
                    community. Harassment, abusive language, and inappropriate
                    content are prohibited.
                  </Text>
                  <Text style={styles.modalText}>
                    • Prohibited Activities: You agree not to use LocalVibe for
                    unlawful activities, including but not limited to:
                  </Text>
                  <Text style={styles.modalTextText}>
                    {' '}
                    o Posting or sharing false, harmful, or offensive content
                  </Text>
                  <Text style={styles.modalTextText}>
                    {' '}
                    o Engaging in phishing, spamming, or malicious software
                    distribution
                  </Text>
                  <Text style={styles.modalTextText}>
                    {' '}
                    o Impersonating others or using fake identities
                  </Text>
                  <Text style={styles.modalTextText}>
                    {' '}
                    o Accessing or tampering with LocalVibe's security features
                  </Text>

                  <Text style={styles.modalTextTitle}>
                    4. Content and Intellectual Property
                  </Text>
                  <Text style={styles.modalText}>
                    • User-Generated Content: LocalVibe allows users to post
                    content, including images, text, and comments. You retain
                    ownership of your content but grant LocalVibe a worldwide,
                    royalty-free, and non-exclusive license to use, display,
                    modify, and distribute this content on the platform.
                  </Text>
                  <Text style={styles.modalText}>
                    • Intellectual Property: All logos, trademarks, graphics,
                    and content related to LocalVibe are the property of
                    LocalVibe and protected by intellectual property laws. You
                    may not use these materials without our permission.
                  </Text>

                  <Text style={styles.modalTextTitle}>
                    5. Account Suspension and Termination
                  </Text>
                  <Text style={styles.modalText}>
                    LocalVibe reserves the right to suspend or terminate
                    accounts that violate these Terms. Repeated or severe
                    violations, such as posting offensive content or engaging in
                    fraudulent activities, may lead to permanent suspension or
                    deletion of the account.
                  </Text>

                  <Text style={styles.modalTextTitle}>
                    6. Limitation of Liability
                  </Text>
                  <Text style={styles.modalText}>
                    LocalVibe is provided on an "as-is" basis, and we make no
                    guarantees regarding the app's functionality, security, or
                    reliability. We are not liable for any damages or losses
                    arising from your use of LocalVibe, including but not
                    limited to personal injury, data loss, or unauthorized
                    access to your account.
                  </Text>

                  <Text style={styles.modalTextTitle}>7. Changes to Terms</Text>
                  <Text style={styles.modalText}>
                    LocalVibe may update these Terms from time to time. Any
                    modifications will be posted in the app, and continued use
                    of LocalVibe following updates constitutes acceptance of the
                    revised Terms.
                  </Text>
                </ScrollView>

                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleModalClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <View style={{width: '100%', justifyContent: 'center', alignItems: 'center'}}>
            <TouchableOpacity style={styles.signInSignup} onPress={handleSignUpPress} disabled={!isChecked}>
              <View
                style={[
                  styles.signUpButton,
                  {backgroundColor: isChecked ? '#017E5E' : '#cccccc'},
                ]}>
                <Text style={styles.signUpText}>Finish</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{
              alignItems: 'center', elevation: 5, shadowColor: '#000', borderColor: '#ccc', borderWidth: 1, borderRadius: 10, width: '80%',
            }} onPress={() => navigation.goBack()}>
              <View style={styles.signInButton}>
                <Text style={styles.signInText}>Back</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <Text style={{fontWeight: 'bold', fontSize: 20, textAlign: 'center'}}>WARNING!</Text>
            <Text style={[styles.modalText, { textAlign: 'center' }]}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton,{marginTop: 5,}]}>
              <Text style={[styles.modalButtonText,{textAlign: 'center',}]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalWrapper: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#017E5E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  eyePassword:{
    height: 20,
    width: 50,
    resizeMode: 'contain',
  },
  termsTriggerText: {
    color: '#017E5E',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalWrapper: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  scrollViewContent: {
    paddingVertical: 20,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#017E5E',
    textAlign: 'center',
  },
  modalTextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalText: {
    fontSize: 14,
    marginTop: 5,
    lineHeight: 20,
  },
  modalTextText: {
    fontSize: 14,
    marginLeft: 15,
    lineHeight: 20,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#017E5E',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  termsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  termsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#017E5E',
  },

  container: {
    flex: 1,
    backgroundColor: '#F1FFF8',
  },
  containerFocused: {
    position: 'absolute',
    top: -150,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 750,
  },
  body: {
    flexDirection: 'column',
  },
  logoContainer: {
    marginTop: '18%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame13: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  gettingStarterBlock: {
    marginTop: '30%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  forms: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  loginBlock: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginHorizontal: '8%',
    width: '80%',
  },
  gettingStarted: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: '5%',
  },
  gettingStartedText: {
    width: 148,
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  joinToExploreText: {
    width: 148,
    color: 'black',
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '300',
  },
  loginPass: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
  },
  inputContainer: {
    height: 60,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 22,
    width: '100%',
  },
  inputLabel: {
    width: '100%',
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 39,
    backgroundColor: 'white',
    borderRadius: 10,
    borderColor: '#9e9e9e',
    borderWidth: 0,
    paddingHorizontal: 10,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signInSignup: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  signUpButton: {
    width: '80%',
    height: 39,
    backgroundColor: '#017E5E',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },
  signUpText: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
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
});

export default SignupScreen;
