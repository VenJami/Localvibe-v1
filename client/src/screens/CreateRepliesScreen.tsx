import {
  View,
  Text,
  SafeAreaView,
  Image,
  TextInput,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import getTimeDuration from '../common/TimeGenerator';
import axios from 'axios';
import {URI} from '../../redux/URI';
import {getAllPosts} from '../../redux/actions/postAction';
import {updateInteraction} from '../../redux/actions/userAction';

type Props = {
  item: any;
  navigation: any;
  route: any;
  postId: string;
};

const CreateRepliesScreen = ({navigation, route}: Props) => {
  const post = route.params.item;
  const postId = route.params.postId;
  const {user, token} = useSelector((state: any) => state.user);
  const [image, setImage] = useState('');
  const [title, setTitle] = useState('');
  const dispatch = useDispatch();

  const ImageUpload = async () => {
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

  const time = post.createdAt;
  const formattedDuration = getTimeDuration(time);

  const createReplies = async () => {
    if (!postId) {
      updateInteraction(post._id, user)(dispatch);

      await axios
        .put(
          `${URI}/add-replies`,
          {
            postId: post._id,
            title,
            image,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .then((res: any) => {
          getAllPosts()(dispatch);
          navigation.navigate('PostDetails', {
            data: res.data.post,
            navigation: navigation,
          });
          setTitle('');
          setImage('');
        });
    } else {
      updateInteraction(post._id, user)(dispatch);

      await axios
        .put(
          `${URI}/add-reply`,
          {
            postId,
            replyId: post._id,
            title,
            image,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .then((res: any) => {
          navigation.navigate('PostDetails', {
            data: res.data.post,
            navigation: navigation,
          });
          setTitle('');
          setImage('');
        });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        animated={true}
        backgroundColor={'#F1FFF8'}
        barStyle={'dark-content'}
        showHideTransition={'fade'}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Image source={require('../assets/goBack.png')} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Reply</Text>
      </View>
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            <View style={styles.postInfo}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatarContainer}>
                  <Image
                    source={{uri: post.user.avatar.url}}
                    style={styles.userAvatar}
                  />
                  <Image source={require('../assets/line.png')} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{post.user.name}</Text>
                  <Text style={styles.timeText}>{formattedDuration}</Text>
                  <Text style={styles.postTitle}>{post.title}</Text>
                </View>
              </View>
            </View>
            <View>
              {post.image && (
                <Image
                  source={{uri: post.image.url}}
                  style={styles.postImage}
                  resizeMode="contain"
                />
              )}
            </View>

            <View style={styles.replyContainer}>
              <View style={styles.replyHeader}>
                <View style={styles.userAvatarContainer}>
                  <Image
                    source={{uri: user.avatar.url}}
                    style={styles.replyAvatar}
                  />
                </View>

                <View style={styles.replyInputContainer}>
                  <Text style={styles.replyUserName}>{user.name}</Text>
                  <TextInput
                    placeholder={`Reply to ${post.user.name}...`}
                    placeholderTextColor={'#666'}
                    style={styles.replyInput}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>
              <View>
                {image && (
                  <Image source={{uri: image}} style={styles.replyImage} />
                )}
              </View>

              <View style={styles.footerContainer}>
                <TouchableOpacity
                  style={styles.uploadImageButton}
                  onPress={ImageUpload}>
                  <Image
                    style={styles.attachImage}
                    source={require('../assets/attach.png')}
                  />
                </TouchableOpacity>
                <View style={styles.replyButtonContainer}>
                  <TouchableOpacity
                    onPress={createReplies}
                    style={styles.replyButton}>
                    <Text style={styles.replyButtonText}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  postContainer:{
    margin: 30,
  },
  container: {
    backgroundColor: '#fff',
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
  postInfo: {
    flexDirection: 'row',
  },
  userInfo: {
    flexDirection: 'row',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
  },
  userDetails: {
    marginLeft: '5%',
  },
  userName: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timePost: {
    color: '#737373',
  },
  userAvatarContainer: {
    width: 50,
    alignItems: 'center',
  },
  postTitle: {
    textAlign: 'justify',
    color: 'black',
    fontSize: 16,
    width: 270,
  },
  timeText: {
    fontSize: 12,
    color: '#000000b6',
    marginBottom: '3%',
  },
  postImage: {
    width: '90%',
    borderRadius: 10,
  },
  replyContainer: {},
  replyHeader: {
    flexDirection: 'row',
  },
  replyAvatar: {
    width: 45,
    height: 45,
    borderRadius: 100,
  },
  replyInputContainer: {
    marginLeft: '5%',
    width: '82%',
  },
  replyUserName: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  replyInput: {
    color: 'black',
    width: '100%',
  },
  uploadImageButton: {
    marginTop: 8,
  },
  uploadImageIcon: {
    width: 20,
    height: 20,
  },
  replyButtonContainer: {
    padding: 8,
  },
  replyButton: {
    backgroundColor: '#017E5E',
    borderRadius: 17,
    paddingVertical: 5,
    paddingHorizontal: 50,
  },
  replyButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  footerContainer: {
    justifyContent: 'space-between',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
  attachImage: {
    marginLeft: '35%',
  },
});

export default CreateRepliesScreen;
