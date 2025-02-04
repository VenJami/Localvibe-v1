import React, {useState} from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';  

const PremiumScreen = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handlePaymentOptionClick = (option: string) => {
    setSelectedOption(option);
  };

  const getCircleColor = (option: string) => {
    return selectedOption === option ? '#017E5E' : '#AEAEAE';
  };

  const handlePayment = async () => {
    try {
      // Dispatch payment action
    } catch (error) {
      console.error('Error creating payment screen:', error);
      Alert.alert('Payment Error', 'Unable to create payment intent.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Image source={require('../assets/goBack.png')} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Premium Screen</Text>
      </View>

      <View style={styles.infoContainer}>
        <Image
          style={styles.crownImage}
          source={require('../assets/premiumCrown.png')}
        />
        <Text style={styles.text1}>Join our Premium</Text>
        <Text style={styles.text2}>
          unlock the full potential of your business
        </Text>
      </View>

      <View style={styles.subscriptionContainer}>
        {/* Weekly option */}
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => handlePaymentOptionClick('weekly')}>
          <View style={styles.weeklyContainer}>
            <View style={styles.circleContainer}>
              <View
                style={[
                  styles.circle,
                  {backgroundColor: getCircleColor('weekly')},
                ]}></View>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentText1}>Weekly</Text>
              <Text style={styles.paymentText2}>Pay for 7 Days</Text>
            </View>
            <View style={styles.costContainer}>
              <Text style={styles.costText}>₱49</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Monthly option */}
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => handlePaymentOptionClick('monthly')}>
          <View style={styles.weeklyContainer}>
            <View style={styles.circleContainer}>
              <View
                style={[
                  styles.circle,
                  {backgroundColor: getCircleColor('monthly')},
                ]}></View>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentText1}>Monthly</Text>
              <Text style={styles.paymentText2}>Pay monthly</Text>
            </View>
            <View style={styles.costContainer}>
              <Text style={styles.costText}>₱199</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Yearly option */}
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => handlePaymentOptionClick('yearly')}>
          <View style={styles.weeklyContainer}>
            <View style={styles.circleContainer}>
              <View
                style={[
                  styles.circle,
                  {backgroundColor: getCircleColor('yearly')},
                ]}></View>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentText1}>Yearly</Text>
              <Text style={styles.paymentText2}>Pay yearly</Text>
            </View>
            <View style={styles.costContainer}>
              <Text style={styles.costText}>₱1999</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.text3}>
          *Subscription will automatically renews, unless you unsubscribe at
          least 24 hours before its end.
        </Text>

        <TouchableOpacity style={styles.subscribeButton}>
          <Text style={styles.subscribeText}>Subscribe Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eaeaea',
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: 'black',
    elevation: 20,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    width: '75%',
    paddingLeft: 16,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: 'bold',
    color: '#000',
  },
  infoContainer: {
    backgroundColor: '#017E5E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  crownImage: {
    height: 120,
    width: 120,
  },
  text1: {
    fontWeight: 'bold',
    fontSize: 30,
    color: '#fff',
    fontFamily: 'roboto',
  },
  text2: {
    color: '#fff',
    paddingVertical: 10,
  },
  weeklyContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleContainer: {
    marginRight: 20,
  },
  circle: {
    height: 30,
    width: 30,
    borderRadius: 100,
    backgroundColor: '#AEAEAE',
  },
  subscriptionContainer: {
    marginHorizontal: 40,
    marginTop: 15,
  },
  paymentButton: {
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 5,
    borderBottomColor: '#cecece',
    borderBottomWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  paymentText1: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentText2: {
    fontSize: 17,
  },
  paymentInfo: {
    marginRight: 80,
  },
  costContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  costText: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  text3: {
    textAlign: 'center',
    color: '#9e9e9e',
  },
  subscribeButton: {
    backgroundColor: '#017E5E',
    padding: 20,
    marginTop: 40,
    marginHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  subscribeText: {
    fontSize: 20,
    color: '#fff',
  },
});

export default PremiumScreen;
