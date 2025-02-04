import {
  View,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {setItem} from '../../utils/asyncStorage';

const {width, height} = Dimensions.get('window');

export default function OnBoarding() {
  const navigation = useNavigation();

  const handleDone = () => {
    setItem('onBoarded', '1');
    navigation.navigate('Login');
  };

  const doneButton = require('../assets/onboard/done2.png');

  const CustomDoneButton = ({...props}) => {
    return (
      <TouchableOpacity {...props}>
        <Image source={doneButton} style={styles.done} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#E0FBE2"
        barStyle="dark-content"
        showHideTransition="fade"
      />
      <Onboarding
        onDone={handleDone}
        onSkip={handleDone}
        DoneButtonComponent={CustomDoneButton}
        containerStyles={{paddingHorizontal: 15}}
        bottomBarColor="#E0FBE2"
        pages={[
          {
            backgroundColor: '#E0FBE2',
            image: (
              <View>
                <LottieView
                  style={styles.lottie}
                  source={require('../animation/gettingstarted_animation.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: 'Connect with the Community!',
            subtitle:
              "Step into LocalVibe, where unity, friendships, and belonging flourish. Let's create a thriving community together!",
          },
          {
            backgroundColor: '#BFF6C3',
            image: (
              <View>
                <LottieView
                  style={styles.lottie}
                  source={require('../animation/onboarding2nd.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: 'Promote local commerce and discovery!',
            subtitle:
              'Explore local treasures, support businesses, and foster community with LocalVibe. Join the journey!',
          },
          {
            backgroundColor: '#B0EBB4',
            image: (
              <View>
                <LottieView
                  style={styles.lottie}
                  source={require('../animation/onboarding3rd.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: 'Proximity-Based Feeds!',
            subtitle:
              'Discover the magic of proximity with LocalVibe! Our Proximity-Based Feeds keep you connected with your community. ',
          },
          {
            backgroundColor: '#ACE1AF',
            image: (
              <View>
                <LottieView
                  style={styles.lottie}
                  source={require('../animation/onboarding4th.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: 'Event creation and participation!',
            subtitle:
              'Elevate your events with LocalVibe! Bring people together like never before.',
          },
          {
            backgroundColor: '#8DECB4',
            image: (
              <View>
                <LottieView
                  style={styles.lottie}
                  source={require('../animation/onboarding5th.json')}
                  autoPlay
                  loop
                />
              </View>
            ),
            title: 'Express your appreciation for posts!',
            subtitle:
              'Effortlessly show support on LocalVibe! Express appreciation for posts you love.',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  lottie: {
    width: width * 0.9,
    height: width,
  },
  done: {
    position: 'relative',
    marginRight: 10,
    width: width * 0.1,
    height: width * 0.1,
  },
});
