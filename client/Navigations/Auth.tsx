import React, {useEffect, useState} from 'react';
import LoginScreen from '../src/screens/LoginScreen';
import SignUpScreen from '../src/screens/SignupScreen';
import SignUpInfo from '../src/screens/SignupInfo';
import OnBoarding from '../src/screens/OnBoarding';
import {getItem, setItem} from '../utils/asyncStorage';

import {createNativeStackNavigator} from '@react-navigation/native-stack';

type Props = {};
const Auth = (props: Props) => {
  const Stack = createNativeStackNavigator();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null); // Set initial state as null

  useEffect(() => {
    checkIfAlreadyOnboarded();
  }, []);

  const checkIfAlreadyOnboarded = async () => {
    let onBoarded = await getItem('onBoarded');

    if (onBoarded === null) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  };

  if (showOnboarding === null) {
    return null;
  }

   if (showOnboarding) {
     return (
       <Stack.Navigator
         initialRouteName="Onboarding"
         screenOptions={{
           headerShown: false,
         }}>
         <Stack.Screen name="OnBoarding" component={OnBoarding} />
         <Stack.Screen name="Login" component={LoginScreen} />
         <Stack.Screen name="Signup" component={SignUpScreen} />
         <Stack.Screen name="Signinfo" component={SignUpInfo} />
       </Stack.Navigator>
     );
   } else {
     return (
       <Stack.Navigator
         initialRouteName="Login"
         screenOptions={{
           headerShown: false,
         }}>
         <Stack.Screen name="Login" component={LoginScreen} />
         <Stack.Screen name="Signup" component={SignUpScreen} />
         <Stack.Screen name="Signinfo" component={SignUpInfo} />
       </Stack.Navigator>
     );
   }
};

export default Auth;
