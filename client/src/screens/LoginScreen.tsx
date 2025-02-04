import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {loadUser, loginUser} from '../../redux/actions/userAction';

type Props = {
  navigation: any;
};

const LoginScreen = ({navigation}: Props) => {
  const {error, isAuthenticated} = useSelector((state: any) => state.user);
  const backgroundImage = require('../assets/background.png');
  const logo = require('../assets/logo.png');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false); // State to track focus

  const dispatch = useDispatch();

  const submitHandler = () => {
    console.log('Login submitted');
    loginUser(email, password)(dispatch);
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Login failed!', error);
    }
    if (isAuthenticated) {
      Alert.alert('Login Successful!');
      navigation.navigate('Home');
      loadUser()(dispatch);
    }
  }, [error, isAuthenticated, navigation, dispatch]);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <Image style={styles.backgroundImage} source={backgroundImage} />
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={logo} />
        </View>
        <View style={styles.body}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Getting Started</Text>
            <Text style={styles.subtitle}>Join to explore!</Text>
          </View>

          <View style={styles.loginPass}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <TextInput
                placeholder="Email or Phone Number"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsFocused(true)} // Handle focus
                onBlur={() => setIsFocused(false)} // Handle blur
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainerPass}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setIsFocused(true)} // Handle focus
                onBlur={() => setIsFocused(false)} // Handle blur
                style={styles.input}
              />
            </View>
            <Text style={styles.forgotPass}>Forgot Password?</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={submitHandler} style={styles.button}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              style={styles.button1}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FFF8',
  },
  containerFocused: {
    position: 'absolute',
    top: -150, // Move the container when input is focused
  },
  forgotPass: {
    color: '#027E5E',
    fontSize: 12,
    width: '97%',
    textAlign: 'right',
  },
  body: {
    marginHorizontal: '8%',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 750,
  },
  logoContainer: {
    alignItems: 'center',
  },
  headerContainer: {
    marginTop: '36%',
    marginBottom: '15%',
  },
  logo: {
    marginTop: '18%',
    width: 180,
    height: 180,
  },
  title: {
    width: 148,
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  subtitle: {
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
    marginBottom: 25,
  },
  inputContainer: {
    height: 60,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  inputContainerPass: {
    height: 60,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    width: 341,
    height: 39,
    backgroundColor: 'white',
    borderRadius: 10,
    borderColor: '#9e9e9e',
    borderWidth: 0,
    paddingHorizontal: 10,
    elevation: 5,
  },
  buttonContainer: {
    elevation: 10,
  },
  button: {
    backgroundColor: '#017E5E',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  button1: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  signupText: {
    color: '#017E5E',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
