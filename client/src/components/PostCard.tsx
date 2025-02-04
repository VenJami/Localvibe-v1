import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Image} from 'react-native';
import getTimeDuration from '../common/TimeGenerator';
import {Share} from 'react-native'; // For sharing functionality
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addLikes,
  getAllPosts,
  removeLikes,
} from '../../redux/actions/postAction';
import axios from 'axios';
import {URI} from '../../redux/URI';
import PostDetailsCard from './PostDetailsCard';
import {
  removeInteraction,
  updateInteraction,
} from '../../redux/actions/userAction';
import {createOrUpdateReportAction} from '../../redux/actions/reportAction'; 
type Props = {
  navigation: any;
  item: any;
  isReply?: boolean | null;
  postId?: string | null;
  replies?: boolean | null;
};

const PostCard = ({item, isReply, navigation, postId, replies}: Props) => {
  const {user, token, users} = useSelector((state: any) => state.user);
  const {posts} = useSelector((state: any) => state.post);
  const dispatch = useDispatch();
  const {pins} = useSelector((state: any) => state.pin);
  const userPin = pins.find(
    (pin: {createdBy: any}) => pin.createdBy === item.user._id,
  );
  const [userInfo, setUserInfo] = useState({
    name: '',
    avatar: {
      url: 'https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png',
    },
  });
  const time = item?.createdAt;
  const formattedDuration = getTimeDuration(time);
 const [isShareActive, setIsShareActive] = useState(false);
  const profileHandler = async (e: any) => {
    await axios
      .get(`${URI}/get-user/${e._id}`, {
        headers: {Authorization: `Bearer ${token}`},
      })
      .then(res => {
        if (res.data.user._id !== user._id) {
          navigation.navigate('UserProfile', {
            item: res.data.user,
          });
        } else {
          navigation.navigate('Profile');
        }
      });
  };

  const reactsHandler = (e: any) => {
    if (item.likes.length !== 0) {
      const isLikedBefore = item.likes.find((i: any) => i.userId === user._id);
      if (isLikedBefore) {
        removeLikes({postId: postId ? postId : e._id, posts, user})(dispatch);
        removeInteraction(e._id, user)(dispatch);
      } else {
        addLikes({postId: postId ? postId : e._id, posts, user})(dispatch);
        updateInteraction(e._id, user)(dispatch);
      }
    } else {
      addLikes({postId: postId ? postId : e._id, posts, user})(dispatch);
      updateInteraction(e._id, user)(dispatch);
    }
  };

  const deletePostHandler = async (e: any) => {
    await axios
      .delete(`${URI}/delete-post/${e}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => {
        getAllPosts()(dispatch);
      });
  };
useEffect(() => {
  // Load share state from AsyncStorage when the component mounts
  const loadShareState = async () => {
    const sharedStatus = await AsyncStorage.getItem(`sharedPost_${item._id}`);
    if (sharedStatus === 'true') {
      setIsShareActive(true);
    }
  };
  loadShareState(); // Check share status on mount
}, [item._id]);

const shareHandler = async () => {
  try {
    // Share the post
    await Share.share({
      message: `Check out this post: ${item.title}`,
    });

    // Update the share status in local state
    if (isShareActive) {
      setIsShareActive(false);
      await AsyncStorage.removeItem(`sharedPost_${item._id}`); // Remove shared status
    } else {
      setIsShareActive(true);
      await AsyncStorage.setItem(`sharedPost_${item._id}`, 'true'); // Save shared status
    }
  } catch (error) {
    alert('Error sharing post: ' + error.message);
  }
};

  useEffect(() => {
    if (users) {
      const updatedUsers = [...users, user];
      const userData = updatedUsers.find(
        (user: any) => user._id === item.user._id,
      );
      setUserInfo(userData);
    }
  }, [users]);

  const [openModal, setOpenModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const reportReasons = [
    {label: 'Violent content', value: 'violent'},
    {label: 'Explicit Content', value: 'explicit'},
    {label: 'Hate speech', value: 'hate'},
    {label: 'Illegal activities', value: 'illegal'},
    {label: 'Others', value: 'others'},
  ];
const handleConfirmReport = () => {
  console.log('Confirm Report button clicked'); // Log action initiation

  if (selectedReason) {
    console.log('Selected Reason:', selectedReason); // Log the selected reason
    console.log('Reporting User ID:', user._id); // Log the reporting user's ID
    console.log('Reported Item ID:', item._id); // Log the ID of the reported post
    console.log('Report Type: post'); // Log the assumed type
    console.log(selectedReason);
    // Dispatch the report action
    dispatch(
      createOrUpdateReportAction(
        user._id, // The reporting user's ID
        item._id, // The ID of the reported post
        'post', // Assuming this is a post
        selectedReason, // The selected reason for reporting
      ),
    );

    console.log('Report dispatched successfully.'); // Confirm dispatch success

    setOpenModal(false); // Close the modal
    console.log('Modal closed.'); // Confirm modal closure

    setSelectedReason(null); // Reset the selected reason
    console.log('Selected reason reset to null.'); // Confirm reset
  } else {
    console.log('No reason selected. Report not dispatched.'); // Log if no reason was selected
  }
};


  const handleCancelReport = () => {
    setOpenModal(false); // Close the modal without reporting
    setSelectedReason(null); // Reset the selected reason
  };
  return (
    <View style={styles.container}>
      <View style={styles.postContainer}>
        <View style={styles.userRow}>
          <View style={styles.userInfoContainer}>
            <TouchableOpacity onPress={() => profileHandler(item.user)}>
              <Image
                source={{uri: item?.user?.avatar?.url}}
                style={styles.userAvatar}
              />
            </TouchableOpacity>
            <View style={styles.userNameContainer}>
              <TouchableOpacity
                style={styles.userNameRow}
                onPress={() => profileHandler(userInfo)}>
                <Text style={styles.userNameText}>{item?.user.name}</Text>
              </TouchableOpacity>
              <Text style={styles.timeText}>{formattedDuration}</Text>
            </View>

            {(item?.user.accountType === 'prembusiness' ||
              item?.user.accountType === 'business') && (
              <TouchableOpacity
                style={styles.openMap}
                onPress={() =>
                  navigation.navigate('Map', {
                    latitude: userPin.latitude,
                    longitude: userPin.longitude,
                  })
                }>
                <Text style={styles.userNameText}>Open Map</Text>
              </TouchableOpacity>
            )}

            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => setOpenModal(true)}>
                <Image
                  source={require('../assets/report.png')}
                  style={styles.report}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.postTitleText}>{item.title}</Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('PostDetails', {
              data: item,
            })
          }>
          <View style={styles.postImageContainer}>
            {item.image && (
              <Image
                source={{uri: item.image.url}}
                style={styles.postImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.reactsRow}>
          <TouchableOpacity onPress={() => reactsHandler(item)}>
            {item.likes.length > 0 ? (
              <>
                {item.likes.find((i: any) => i.userId === user._id) ? (
                  <Image
                    source={require('../assets/reactActive.png')}
                    style={styles.reactIcon}
                  />
                ) : (
                  <Image
                    source={require('../assets/react.png')}
                    style={styles.reactIcon}
                  />
                )}
              </>
            ) : (
              <Image
                source={require('../assets/react.png')}
                style={styles.reactIcon}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('CreateReplies', {
                item: item,
                navigation: navigation,
                postId: postId,
              });
            }}>
            <Image
              source={require('../assets/comment.png')}
              style={styles.commentIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareHandler}>
            <Image
              source={
                isShareActive
                  ? require('../assets/shareActive.png') // Active state image
                  : require('../assets/share.png') // Default state image
              }
              style={styles.shareIcon}
            />
          </TouchableOpacity>
        </View>
        {!isReply && (
          <View style={styles.repliesRow}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PostDetails', {
                  data: item,
                })
              }>
              <Text style={styles.repliesText}>
                {item?.replies?.length !== 0 &&
                  `${item?.replies?.length} replies ·`}
              </Text>
            </TouchableOpacity>

            {item.likes.length !== 0 && (
              <TouchableOpacity
                onPress={() =>
                  item.likes.length !== 0 &&
                  navigation.navigate('PostLikeCard', {
                    item: item.likes,
                    navigation: navigation,
                  })
                }>
                <Text style={styles.likesText}>
                  {item.likes.length} {item.likes.length > 1 ? 'likes' : 'like'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {replies && (
          <>
            {item?.replies?.map((i: any) => (
              <PostDetailsCard
                navigation={navigation}
                key={i._id}
                item={i}
                isReply={true}
                postId={item._id}
              />
            ))}
          </>
        )}
        {openModal && (
          <View style={styles.modalContainer}>
            <Modal
              animationType="fade"
              transparent={true}
              visible={openModal}
              onRequestClose={handleCancelReport}>
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <View style={styles.modalTitleContainer}>
                    <Text style={styles.modalTitle}>Report Post</Text>
                  </View>
                  {reportReasons.map(reason => (
                    <TouchableOpacity
                      key={reason.value}
                      onPress={() => setSelectedReason(reason.value)}>
                      <Text
                        style={
                          selectedReason === reason.value
                            ? styles.selectedReason
                            : styles.reasonText
                        }>
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      onPress={handleConfirmReport}
                      style={styles.confirmButton}>
                      <Text style={styles.buttonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCancelReport}
                      style={styles.cancelButton}>
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        )}
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  openMap: {
    marginLeft: 40,
  },
  container: {
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1FFF8',
    backgroundColor: '#fff',
  },
  postContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    margin: 5,
    backgroundColor: '#fff',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfoContainer: {
    flexDirection: 'row',
    width: '85%',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userNameContainer: {
    paddingLeft: 10,
    width: '70%',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    fontWeight: 'bold',
    color: '#000',
  },
  postTitleText: {
    color: '#000',
    marginTop: 20,
    fontSize: 16,
  },
  timeText: {
    color: '#555',
    fontSize: 12,
  },
  report: {
    marginTop: 2,
    height: 25,
    width: 25,
    resizeMode: 'contain',
    marginLeft: 80,
  },
  postImageContainer: {
    paddingVertical: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  reactsRow: {
    flexDirection: 'row',
    paddingTop: 10,
    justifyContent: 'space-around',
  },
  reactIcon: {
    marginTop: 3,
    width: 25,
    height: 25,
  },
  commentIcon: {
    width: 30,
    height: 30,
  },
  shareIcon: {
    width: 30,
    height: 30,
  },
  repliesRow: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 5,
  },
  repliesText: {
    fontWeight: 'bold',
  },
  likesText: {
    paddingLeft: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1, // Ensures the modal takes up the entire screen
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Black with 0.5 opacity
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300, // Optional: to control the max width of the modal
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10, // For Android shadow effect
  },
  modalTitleContainer: {
    width: '90%',
    borderBottomColor: '#000',
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  modalTitle: {
    lineHeight: 20,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#017E5E',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedReason: {
    color: '#017E5E', // Selected reason color
    fontSize: 16,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  reasonText: {
    marginBottom: 15,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: '#FF1212',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#017E5E',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
