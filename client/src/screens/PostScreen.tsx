import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {createPostAction} from '../../redux/actions/postAction';
import {CommonActions} from '@react-navigation/native'; // Import for navigation reset

type Props = {
  navigation: any;
};

const PostScreen = ({navigation}: Props) => {
  const {user} = useSelector((state: any) => state.user);
  const {isSuccess, isLoading} = useSelector((state: any) => state.post);
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (
      replies.length === 1 &&
      replies[0].title === '' &&
      replies[0].image === ''
    ) {
      setReplies([]);
    }
    setReplies([]);
    setTitle('');
    setImage('');
  }, [isSuccess]);

  const [replies, setReplies] = useState([
    {
      title: '',
      image: '',
      user: '',
    },
  ]);

  const postImageUpload = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: true,
    }).then((image: ImageOrVideo | null) => {
      if (image) {
        setImage('data:image/jpeg;base64,' + image.data);
      }
    });
  };

  const createPost = () => {
    if (title !== '' || (image !== '' && !isLoading)) {
      createPostAction(title, image, user, replies)(dispatch);
    }

    // Add a 1-second delay before navigating to Home and resetting the stack
    setTimeout(() => {
      // Reset the navigation stack to simulate a full refresh
      navigation.dispatch(
        CommonActions.reset({
          index: 0, // Navigate to the first screen (Home)
          routes: [{name: 'Home'}],
        }),
      );
      // Alternatively, you could clear/reset relevant states here as needed
    }, 1000); // 1000ms delay = 1 second
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                style={styles.goBackButton}
                source={require('../assets/goBack.png')}
              />
            </TouchableOpacity>
            <Image
              style={styles.logo}
              source={require('../assets/localvibe.png')}
            />
          </View>
        </View>

        <View style={styles.mainContainer}>
          <View style={styles.userInfoContainer}>
            <Image source={{uri: user?.avatar.url}} style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>{user?.name}</Text>
              </View>
            </View>
          </View>
          <TextInput
            multiline={true}
            numberOfLines={6}
            placeholder="What's on your mind..."
            placeholderTextColor={'#000'}
            value={title}
            onChangeText={text => setTitle(text)}
            style={styles.textInput}
          />

          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={postImageUpload}>
              <Image
                source={require('../assets/newsfeed/upload.png')}
                style={styles.uploadIcon}
              />
            </TouchableOpacity>

            <View>
              <Text style={styles.uploadButtonText}>Photo</Text>
            </View>
          </View>
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <Image
              source={{uri: image}}
              style={styles.uploadedImage}
              resizeMethod="auto"
            />
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.postButtonContainer}>
          <TouchableOpacity onPress={createPost} style={styles.postButton}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d3d3d3',
    backgroundColor: '#FFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goBackButton: {
    width: 24,
    height: 24,
  },
  logo: {
    height: 60,
  },
  headerText: {
    fontSize: 20,
    marginLeft: 16,
    fontWeight: '600',
    color: '#000',
  },
  userInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  userAvatar: {
    width: 70,
    height: 70,
    margin: 10,
    borderRadius: 50,
  },
  userInfo: {
    flex: 1,
  },
  userNameContainer: {
    width: '70%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 20,
    marginTop: 8,
    fontWeight: '600',
    color: '#000000',
  },
  textInput: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#EDEBEB',
    margin: 10,
    color: '#000',
    fontSize: 15,
    fontFamily: 'Roboto',
    textAlignVertical: 'top',
  },
  uploadButton: {
    margin: 20,
    marginVertical: 8,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  uploadIcon: {
    width: 28,
    height: 28,
  },
  imageContainer: {
    margin: 8,
  },
  uploadedImage: {
    width: 200,
    height: 300,
  },
  footer: {
    padding: 8,
  },
  postButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  postButton: {
    backgroundColor: '#017E5E',
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '30%',
  },
  postButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mainContainer: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20, // Ensure border radius is applied
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 10,
    elevation: 3,
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PostScreen;
