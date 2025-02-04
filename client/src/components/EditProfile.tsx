import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import axios from 'axios';
import {URI} from '../../redux/URI';
import {loadUser} from '../../redux/actions/userAction';
import {Title, Caption} from 'react-native-paper';

type Props = {
  navigation: any;
};

const EditProfile = ({navigation}: Props) => {
  const {user, token} = useSelector((state: any) => state.user);
  const [avatar, setAvatar] = useState(user?.avatar?.url);
  const dispatch = useDispatch();
  const [userData, setUserData] = useState({
    name: user.name,
    userName: user?.userName,
    bio: user?.bio,
    email: user?.email,
    password: user?.password,
  });

  const [isFocused, setIsFocused] = useState(false);

  const handleSubmitHandler = async () => {
    if (userData.name.length !== 0 && userData.userName.length !== 0) {
      await axios
        .put(
          `${URI}/update-profile`,
          {
            name: userData.name,
            userName: userData.userName,
            bio: userData.bio,
            email: userData.email,
            password: userData.password,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .then((res: any) => {
          loadUser()(dispatch);
        });
    }
  };

  const handleFocus = () => setIsFocused(true); // Set isFocused to true when input is focused
  const handleBlur = () => setIsFocused(false); // Set isFocused to false when input loses focus

  const ImageUpload = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: true,
    }).then((image: ImageOrVideo | null) => {
      if (image) {
        axios
          .put(
            `${URI}/update-avatar`,
            {
              avatar: 'data:image/jpeg;base64,' + image?.data,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
          .then((res: any) => {
            loadUser()(dispatch);
          });
      }
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isFocused && {position: 'absolute', top: -300, width: '100%'}, // Move container up when focused
      ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Image source={require('../assets/goBack.png')} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>

      <View style={styles.bgImageContainer}>
        <Image style={styles.image} source={require('../assets/cover.png')} />
      </View>

      <View style={styles.container}>
        <View style={styles.formContainer}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={ImageUpload}>
              <Image source={{uri: avatar}} style={styles.avatar} />
              <Image/>
            </TouchableOpacity>
          </View>
          <View style={styles.formRow}>
            <View style={styles.inputContainer}>
              <View style={styles.infoContainer}>
                <Title style={styles.name}>{user?.name}</Title>
                <Caption style={styles.username}>{user?.userName}</Caption>
              </View>

              <View style={styles.labelContainer}>
                <View style={styles.title}>
                  <Text style={styles.titleText}>Profile</Text>
                  <View style={styles.hLineContainer}></View>
                </View>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={userData.name}
                  onChangeText={e => setUserData({...userData, name: e})}
                  placeholder="Enter your name..."
                  placeholderTextColor={'#000'}
                  style={styles.input}
                  onFocus={handleFocus} // Trigger focus handler
                  onBlur={handleBlur} // Trigger blur handler
                />

                <Text style={styles.label}>Username</Text>
                <TextInput
                  value={userData.userName}
                  onChangeText={e => setUserData({...userData, userName: e})}
                  placeholder="Enter your userName..."
                  placeholderTextColor={'#000'}
                  style={[styles.input]}
                  onFocus={handleFocus} // Trigger focus handler
                  onBlur={handleBlur} // Trigger blur handler
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                  value={userData.bio}
                  onChangeText={e => setUserData({...userData, bio: e})}
                  placeholder="Enter your bio..."
                  placeholderTextColor={'#000'}
                  style={styles.bioInput}
                  multiline={true}
                  numberOfLines={2}
                  onFocus={handleFocus} // Trigger focus handler
                  onBlur={handleBlur} // Trigger blur handler
                />

                <View style={styles.title}>
                  <Text style={styles.titleText}>Account</Text>
                  <View style={styles.hLineContainer1}></View>
                </View>

                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={userData.email}
                  onChangeText={e => setUserData({...userData, email: e})}
                  placeholder="Enter your email..."
                  placeholderTextColor={'#000'}
                  style={[styles.input]}
                  onFocus={handleFocus} // Trigger focus handler
                  onBlur={handleBlur} // Trigger blur handler
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  onChangeText={e => setUserData({...userData, password: e})}
                  placeholder="Change your password..."
                  placeholderTextColor={'#000'}
                  style={[styles.input]}
                  onFocus={handleFocus} // Trigger focus handler
                  onBlur={handleBlur} // Trigger blur handler
                />
              </View>
            </View>
          </View>

          <View style={styles.doneButtonContainer}>
            <TouchableOpacity onPress={handleSubmitHandler}>
              <Text style={styles.doneButton}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#EDEBEB',
    flex: 1,
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: 'black',
    elevation: 20,
  },

  bgImageContainer: {
    position: 'absolute',
    top: 60,
  },
  image: {
    height: 200,
    resizeMode: 'stretch',
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
  container: {
    flex: 1,
    marginTop: '23%',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    borderRadius: 10,
    borderColor: '#0000002e',
    borderWidth: 1,
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
  },
  titleText: {
    width: 'auto',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#017E5E',
    marginRight: 10,
  },
  hLineContainer: {
    top: -8,
    width: '80%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  hLineContainer1: {
    top: -8,
    width: '76%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  formRow: {
    marginTop: 145,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    fontSize: 15,
    backgroundColor: '#EDEBEB',
    color: '#000000b0',
    borderRadius: 15,
    borderBottomColor: '#cecece',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingBottom: 3,
    paddingTop: 10,
    marginBottom: 5,
  },
  bioInput: {
    fontSize: 15,
    color: '#000000b0',
    borderRadius: 15,
    backgroundColor: '#EDEBEB',
    padding: 10,
    textAlignVertical: 'top',
  },
  avatarContainer: {
    position: 'absolute',
    marginTop: -15,
    width: '100%',
    alignItems: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#00000015',
  },
  bioContainer: {
    borderTopColor: '#00000015',
    borderTopWidth: 1,
  },
  infoContainer: {
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    color: '#000',
    fontSize: 26,
  },
  username: {
    fontWeight: '600',
    color: '#737373',
    fontSize: 14,
    lineHeight: 16,
  },
  labelContainer: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  doneButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#017E5E',
    width: 120,
    textAlign: 'center',
    color: '#fff',
    padding: 12,
    borderRadius: 30,
    fontSize: 14,
  },
});

export default EditProfile;
