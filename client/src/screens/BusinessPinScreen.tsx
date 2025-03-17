import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import PostCard from '../components/PostCard';
import {
  addReviewAction,
  modifyPinAction,
  modifyReviewAction,
  deleteReviewAction,
  deletePinAction,
} from '../../redux/actions/pinAction'; // Import the review actions
import {createOrUpdateReportAction} from '../../redux/actions/reportAction';
import axios from 'axios'; // Import axios
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import {BarChart, StackedBarChart} from 'react-native-chart-kit';
import {URI} from '../../redux/URI';

type Props = {
  route: any;
  navigation: any;
};

const MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 55;
const MAX_HEIGHT = 350;
// State for managing the active tab (Posts or Vibe)

const BusinessPinScreen = ({route, navigation}: Props) => {
  const [localPins, setLocalPins] = useState([]);
  const [averageRating, setAverageRating] = useState<number>(0); // To store the average rating
  const {pins} = route.params;
  const [showModal, setShowModal] = useState(!pins.isVerified); // Show modal if not verified
  const localPin = localPins.find((pin: any) => pin._id === pins._id);

  useEffect(() => {
    const fetchPins = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const response = await fetch(`${URI}/get-all-pins`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        setLocalPins(data.pins); // Update local state with fetched pins
      } catch (error) {
        console.error('Error fetching pins:', error);
      }
    };

    fetchPins(); // Fetch pins initially

    // Set up polling to fetch pins every 5 seconds
    const pollPins = () => {
      fetchPins(); // Always fetch pins
      setTimeout(pollPins, 5000); // Schedule the next fetch
    };

    pollPins(); // Start polling

    // Clear the timeout on component unmount
    return () => {
      console.log('Polling cleared.');
    };
  }, []); // Removed isEditing as a dependency

  const handleMapPress = (e: any) => {
    const {latitude, longitude} = e.nativeEvent.coordinate;
    setLatitude(latitude); // Set the new latitude where the user pressed
    setLongitude(longitude); // Set the new longitude where the user pressed
  };

  useEffect(() => {

    if (localPins.length > 0 && pins) {

      if (localPin) {
        // Set the description and contact info
        setPinDescription(localPin.description || 'No description available');
        setPinContactInfo({
          phone: localPin.contactInfo?.phone || 'N/A',
          email: localPin.contactInfo?.email || 'N/A',
        });
        // Log the visitors array and update visitor count
        const visitorCount = localPin.visitors ? localPin.visitors.length : 0;
        setVisitorLength(visitorCount);

        // Retrieve the image URL from the localPin object
        const imageUrl = localPin.image
          ? localPin.image.url
          : 'No image available';
        setImageUrl(imageUrl);

        // Set the reviews from localPin if available
        if (localPin.reviews) {
          setReviews(localPin.reviews);
        } else {
          console.log('No reviews found for this pin.');
        }

        // Handle the dynamic updates for ratings
        if (localPin.reviews && localPin.reviews.length > 0) {
          const totalRatings = localPin.reviews.reduce(
            (acc: number, review: any) => acc + review.ratings,
            0,
          );
          const avgRating = totalRatings / localPin.reviews.length;
          setAverageRating(avgRating);
        } else {
          setAverageRating(0);
        }
      } else {
        console.log('Pin not found in local storage');
      }
    } else {
      console.log('localPins or pins are missing or empty:', {
        localPins,
        pins,
      });
    }
  }, [localPins, pins]); // Add localPins as a dependency

  const [pinDescription, setPinDescription] = useState('');
  const [pinContactInfo, setPinContactInfo] = useState({
    phone: '',
    email: '',
  });
  const [visitorLength, setVisitorLength] = useState(0); // Initialize state for visitor length
  const [imageUrl, setImageUrl] = useState(null); // State for image URL
  const {user, token} = useSelector((state: any) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteBusinessModal, setDeleteBusinessModal] = useState(false);

  const dispatch = useDispatch();

  const {posts} = useSelector((state: any) => state.post);
  const [activeTab, setActiveTab] = useState('Details');

  const handleBackPress = () => {
    navigation.navigate('Map');
  };

  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json`,
          {
            params: {
              latlng: `${pins.latitude},${pins.longitude}`,
              key: 'AIzaSyClgs3wKE9q0DI-dMrOnwBOIpfFkHDDf6c',
            },
          },
        );
        const results = response.data.results;
        if (results && results.length > 0) {
          // Extract street and city from the formatted address
          const components = results[0].address_components;
          const street = components.find(comp =>
            comp.types.includes('route'),
          )?.long_name;
          const city = components.find(comp =>
            comp.types.includes('locality'),
          )?.long_name;

          setAddress(
            `${street || 'Unknown Street'}, ${city || 'Unknown City'}`,
          );
        } else {
          setAddress('Address not found');
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setAddress('Unable to fetch address');
      }
    };

    fetchAddress();
  }, [pins.latitude, pins.longitude]);

  // State for the follow button (toggle between follow/unfollow)
  const [isFollowed, setIsFollowed] = useState(false);
  const [latitude, setLatitude] = useState<string | number | null>(
    pins.latitude,
  );
  const [longitude, setLongitude] = useState<string | number | null>(
    pins.longitude,
  );

  // Update latitude and longitude whenever pins change
  useEffect(() => {
    if (pins) {
      setLatitude(pins.latitude);
      setLongitude(pins.longitude);
    }
  }, [pins]);

  // Handle follow button press
  const handleFollowPress = () => {
    setIsFollowed(!isFollowed); // Toggle follow state
  };

  const [postData, setPostData] = useState<any[]>([]);

  useEffect(() => {
    // Filter posts where post.user._id matches pins.createdBy
    const matchingPosts = posts.filter(
      post => post.user._id === pins.createdBy,
    );
    setPostData(matchingPosts);
  }, [posts, pins.createdBy]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl); // Set the selected image when clicked
  };

  const closeModal = () => {
    setSelectedImage(null); // Close the modal by resetting the selected image
  };

  // If a review is selected for editing, pre-fill the fields

  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  // Step 2: Add a new review
  // Add a new review and update AsyncStorage
  // Save reviews to AsyncStorage and update the corresponding pin directly in "pins"
  const [editableDescription, setEditableDescription] = useState(
    pinDescription || '',
  );
  const [editablePhone, setEditablePhone] = useState(
    pinContactInfo.phone || '',
  );
  const [editableEmail, setEditableEmail] = useState(
    pinContactInfo.email || '',
  );


  useEffect(() => {
    setEditableDescription(pinDescription || '');
    setEditablePhone(pinContactInfo.phone || '');
    setEditableEmail(pinContactInfo.email || '');
  }, [pinDescription, pinContactInfo]);

  const handleSavePin = async () => {
    try {
      const pinsData = await AsyncStorage.getItem('pins');
      if (pinsData) {
        const parsedPins = JSON.parse(pinsData);
        const updatedPins = {
          ...parsedPins,
          pins: parsedPins.pins.map((pin: any) =>
            pin._id === pins._id
              ? {
                  ...pin,
                  image: editedImage || localPin.image.url,
                  description: editableDescription || localPin.description,
                  contactInfo: {
                    phone: editablePhone || localPin.contactInfo.phone,
                    email: editableEmail || localPin.contactInfo.email,
                  },
                  latitude,
                  longitude,
                }
              : pin,
          ),
        };

        await AsyncStorage.setItem('pins', JSON.stringify(updatedPins));

        // Dispatch to update backend
        dispatch(
          modifyPinAction(
            pins._id,
            pins.businessName,
            editableDescription || localPin.description,
            pins.category,
            latitude,
            longitude,
            {
              phone: editablePhone || localPin.contactInfo.phone,
              email: editableEmail || localPin.contactInfo.email,
            },
            editedImage || localPin.image.url,
            localPin.openingHours || 'N/A',
          ),
        );

        Alert.alert('Success', 'Pin updated successfully!');
        closeModals();
      }
    } catch (error) {
      console.error('Error saving pin:', error);
      Alert.alert('Error', 'Could not save the pin');
    }


  };

  const saveReviewsToAsyncStorage = async (updatedReviews: any[]) => {
    try {
      // Fetch the current pins from AsyncStorage
      const pinsData = await AsyncStorage.getItem('pins');
      if (pinsData) {
        const parsedPins = JSON.parse(pinsData);

        if (parsedPins && parsedPins.pins) {
          // Update the pin in the object that matches the current pin ID
          const updatedPins = {
            ...parsedPins,
            pins: parsedPins.pins.map((pin: any) =>
              pin._id === pins._id ? {...pin, reviews: updatedReviews} : pin,
            ),
          };

          // Save the updated pins back to AsyncStorage
          await AsyncStorage.setItem('pins', JSON.stringify(updatedPins));

          // Update the state with the new reviews
          setReviews(updatedReviews);

          // Recalculate the average rating
          const totalRatings = updatedReviews.reduce(
            (acc: number, review: any) => acc + review.ratings,
            0,
          );
          const avgRating = totalRatings / updatedReviews.length;
          setAverageRating(avgRating); // Update the average rating
        } else {
          console.log('No valid pins data found in AsyncStorage');
        }
      } else {
        console.log('No pins found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error saving reviews to AsyncStorage:', error);
    }
  };

  // Add a new review
  const handleAddReview = async () => {
    // Validate the review input
    if (!newReview.trim() || !newRating) {
      console.error('Review text and rating are required');
      return; // Prevent dispatching if validation fails
    }

    const ratingValue = parseFloat(newRating);
    if (ratingValue < 1 || ratingValue > 5) {
      console.error('Rating must be between 1 and 5');
      return; // Prevent dispatching if rating is out of bounds
    }

    const newReviewObject = {
      pinId: pins._id,
      userId: user._id,
      name: user.name,
      image: user.avatar.url,
      reviewText: newReview,
      ratings: ratingValue,
      createdAt: new Date().toISOString(), // Add createdAt timestamp
    };

    try {
      await dispatch(addReviewAction(pins._id, newReviewObject));
      // Save the new review locally
      const updatedReviews = [...reviews, newReviewObject];
      await saveReviewsToAsyncStorage(updatedReviews);

      // Reset input fields
      setNewReview('');
      setNewRating('');
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  // Modify an existing review
  const handleModifyReview = async () => {
    if (!selectedReviewId) {
      console.error('No review selected for modification');
      return;
    }

    const existingReview = reviews.find(
      review => review._id === selectedReviewId,
    );
    if (!existingReview) {
      console.error('Review not found in local state');
      return;
    }

    const updatedReviews = reviews.map(review =>
      review._id === selectedReviewId
        ? {
            ...review,
            reviewText: newReview,
            ratings: Number(newRating),
          }
        : review,
    );

    try {
      await dispatch(
        modifyReviewAction(pins._id, selectedReviewId, {
          userId: user._id, // Ensure userId is sent
          name: user.name,
          image: user.avatar.url,
          reviewText: newReview,
          ratings: parseFloat(newRating),
        }),
      );

      await saveReviewsToAsyncStorage(updatedReviews);

      setNewReview('');
      setNewRating('');
      setSelectedReviewId('');
    } catch (error) {
      console.error('Error modifying review:', error);
    }
  };

  // Delete a review
  const handleDeleteReview = async (reviewId: string) => {
    const updatedReviews = reviews.filter(review => review._id !== reviewId);

    await dispatch(
      deleteReviewAction(pins._id, reviewId, {
        userId: user._id, // Pass userId
        name: user.name, // Pass user's name
        image: user.avatar.url, // Pass user's avatar URL
      }),
    );
    await saveReviewsToAsyncStorage(updatedReviews);
  };

  const handleEmailClick = () => {
    const email = pins.contactInfo.email;
    const mailtoLink = `mailto:${email}`;
    Linking.openURL(mailtoLink);
  };

  const handlePhoneClick = () => {
    const phoneNumber = pins.contactInfo.phone;
    const telLink = `tel:${phoneNumber}`;
    Linking.openURL(telLink);
  };
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const uploadImage = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: true,
    })
      .then((image: ImageOrVideo) => {
        if (image?.data) {
          // Update state with the edited image
          setEditedImage(`data:image/jpeg;base64,${image.data}`);
        } else {
          Alert.alert('No image selected');
        }
      })
      .catch(error => {
        console.error('Image picking error:', error);
        Alert.alert('Error', 'Could not pick an image');
      });
  };

  const [openModal, setOpenModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  // Define report reasons
  const reportReasons = [
    {label: 'Violent content', value: 'violent'},
    {label: 'Explicit Content', value: 'explicit'},
    {label: 'Hate speech', value: 'hate'},
    {label: 'Illegal activities', value: 'illegal'},
    {label: 'Others', value: 'others'},
  ];

  // Handle report confirmation
  const handleConfirmReport = () => {
    if (selectedReason) {
      // Dispatch the report action
      dispatch(
        createOrUpdateReportAction(
          user._id, // Reporting user's ID
          pins._id, // Reported post ID
          'pins', // Assuming this is a post
          selectedReason, // Selected reason for the report
        ),
      );

      setOpenModal(false); // Close the modal
      setSelectedReason(null); // Reset the selected reason
    } else {
      console.log('No reason selected. Report not dispatched.');
    }
  };

  // Handle cancel report
  const handleCancelReport = () => {
    setOpenModal(false); // Close modal without reporting
    setSelectedReason(null); // Reset the selected reason
  };



  useEffect(() => {
    if (
      localPins.length > 0 &&
      localPins.pins &&
      localPins.pins.length > 0 &&
      pins
    ) {
      const localPin = localPins.pins.find((pin: any) => pin._id === pins._id);
      if (localPin) {
        const visitorData = localPin.visitors || [];
        storeVisitorData(visitorData); // Store visit data
      } else {
        console.log('No matching pin found in localPins');
      }
    } else {
      console.log('localPins.pins or pins is empty or missing');
    }
  }, [localPins, pins]);

  const deleteBusiness = () => {
    console.log('Delete business button clicked'); // Log to confirm button click
    setIsEditing(false); // Close the editing modal

    // Add a slight delay before opening the delete modal
    setTimeout(() => {
      setDeleteBusinessModal(true); // Open the delete confirmation modal
    }, 100); // Adjust the delay as needed (100 milliseconds in this case)
  };

  const confirmDelete = () => {
    if (!localPin || !localPin._id) {
      console.error('No pin found to delete');
      return; // Exit if localPin is not defined
    }

    dispatch(deletePinAction(localPin._id)); // Dispatch the action
    navigation.navigate('Map');
  };

  // Function to get the current week number
  const getWeekNumber = (date: Date) => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startDate.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek);
    return weekNumber;
  };

  const getStarImage = (rating: number) => {
    if (isNaN(rating) || rating === 0) return null; // No star if NaN or 0
    if (rating === 5) return require('../assets/rating/5star.png');
    if (rating >= 4.1) return require('../assets/rating/4HalfStar.png');
    if (rating === 4) return require('../assets/rating/4star.png');
    if (rating >= 3.1) return require('../assets/rating/3HalfStar.png');
    if (rating === 3) return require('../assets/rating/3star.png');
    if (rating >= 2.1) return require('../assets/rating/2HalfStar.png');
    if (rating === 2) return require('../assets/rating/2star.png');
    if (rating >= 1.1) return require('../assets/rating/halfStar.png');
    return require('../assets/rating/1star.png');
  };
  const getRatingDistribution = () => {
    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      belowAverage: 0,
      poor: 0,
    };

    reviews.forEach(review => {
      if (review.ratings >= 4.5) distribution.excellent++;
      else if (review.ratings >= 3.5) distribution.good++;
      else if (review.ratings >= 2.5) distribution.average++;
      else if (review.ratings >= 1.5) distribution.belowAverage++;
      else distribution.poor++;
    });

    const totalReviews = reviews.length;
    return Object.keys(distribution).reduce((acc, key) => {
      acc[key] =
        totalReviews > 0 ? (distribution[key] / totalReviews) * 100 : 0;
      return acc;
    }, {});
  };

  const ratingDistribution = getRatingDistribution();

  const getDaysAgo = createdAt => {
    const reviewDate = new Date(createdAt);
    const currentDate = new Date();
    const timeDifference = currentDate - reviewDate;

    const daysAgo = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Days difference
    const hoursAgo = Math.floor(timeDifference / (1000 * 60 * 60)); // Hours difference

    if (daysAgo === 0) {
      // If the review was created today, show hours
      if (hoursAgo === 0) {
        const minutesAgo = Math.floor(timeDifference / (1000 * 60)); // Minutes difference
        return `${minutesAgo} minutes ago`;
      }
      return `${hoursAgo} hours ago`;
    }

    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

  const [visibleOptions, setVisibleOptions] = useState<string | null>(null);

  const toggleOptions = (reviewId: string) => {
    setVisibleOptions(visibleOptions === reviewId ? null : reviewId);
  };

  const hasUserReviewed = reviews.some(review => review.userId === user._id);
  const safeAverageRating = isNaN(averageRating) ? 0.0 : averageRating;

  const getWeeklyVisitorCounts = (localPin: any) => {
  const currentDate = new Date();
  const weekCounts = Array(7).fill(0); // Array to hold counts for the last 7 days

  // Normalize current date to midnight
  const normalizedCurrentDate = new Date(currentDate.setHours(0, 0, 0, 0));

  // Get the index of today (0 = Sunday, 1 = Monday, etc.)
  const todayIndex = normalizedCurrentDate.getDay();

  if (localPin && Array.isArray(localPin.visitors)) {
    localPin.visitors.forEach(visitor => {
      const visitorDate = new Date(visitor.created_at);
      
      // Normalize visitor date to midnight
      const normalizedVisitorDate = new Date(visitorDate.setHours(0, 0, 0, 0));

      // Calculate the day difference
      const dayDifference = Math.floor(
        (normalizedCurrentDate.getTime() - normalizedVisitorDate.getTime()) / (1000 * 3600 * 24)
      );
      // Correctly assign the count based on the day difference
      if (dayDifference >= 0 && dayDifference < 7) {
        const correctIndex = (todayIndex - dayDifference + 7) % 7; // Adjust for weekly wrap-around
        weekCounts[correctIndex] += 1;
      }
    });
  } else {
    console.warn(`No visitors found for local pin ID: ${localPin?._id}`);
  }
  return weekCounts;
};


  // Call the function with the localPin
  const weeklyVisitorCounts = getWeeklyVisitorCounts(localPin);

  const getWeeklyLikesAndReplies = (postData: any[]) => {
    const currentDate = new Date();
    const weekCounts = Array(7).fill(0); // Array to hold counts for likes
    const repliesCounts = Array(7).fill(0); // Array to hold counts for replies

    postData.forEach(post => {
      // Process likes
      if (Array.isArray(post.likes)) {
        post.likes.forEach(like => {
          // Ensure you access the correct property for the like's creation date
          const likeDate = new Date(like.created_at || like.createdAt); // Use created_at or createdAt
          const dayDifference = Math.floor(
            (currentDate.getTime() - likeDate.getTime()) / (1000 * 3600 * 24),
          );

          if (dayDifference >= 0 && dayDifference < 7) {
            weekCounts[dayDifference] += 1; // Increment the count for likes
          }
        });
      }

      // Process replies
      if (Array.isArray(post.replies)) {
        post.replies.forEach(reply => {
          const replyDate = new Date(reply.createdAt); // Use createdAt
          const dayDifference = Math.floor(
            (currentDate.getTime() - replyDate.getTime()) / (1000 * 3600 * 24),
          );

          if (dayDifference >= 0 && dayDifference < 7) {
            repliesCounts[dayDifference] += 1; // Increment the count for replies
          }
        });
      }
    });

    return {
      likesData: weekCounts.reverse(), // Reverse to show the most recent week first
      repliesData: repliesCounts.reverse(), // Reverse to show the most recent week first
    };
  };

  // Function to open the modal and set isEditing to true
  const openModals = () => {
    setIsEditing(true); // Set isEditing to true when opening the modal
  };

  const openModalReport = () =>{
    setOpenModal(true); // Set isEditing to true when
  };

  // Function to close the modal and set isEditing to false
  const closeModals = () => {
    setIsEditing(false); // Set isEditing to false when closing the modal
  };

  // Inside your component, after calculating visitor counts
  const {likesData = [], repliesData = []} = getWeeklyLikesAndReplies(postData);

  // Logging visitor data and weekly counts
  {localPin && localPin.visitors && (
    <View>
      <Text>Weekly Visitor Counts:</Text>
    </View>
  )}

  // Function to get the day of the week for a specific date
  const logDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const options = { weekday: 'long' }; // Options to get the full name of the day
    const dayName = date.toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.container}>
      {/* Set the StatusBar to be translucent and fully transparent */}
      <StatusBar translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          {editedImage ? (
            <Image source={{uri: editedImage}} style={styles.image} />
          ) : imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageTitle}>No Image Available</Text>
            </View>
          )}
        </View>

        <View>
          <View style={styles.goBackContainer}>
            <TouchableOpacity onPress={handleBackPress}>
              <Image
                style={styles.goBackButton}
                source={require('../assets/goBack1.png')}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.editImageContainer}>
            <Modal
              visible={deleteBusinessModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setDeleteBusinessModal(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <View style={styles.deleteBusinessModal}>
                    <Text style={styles.deleteText}>
                      Do you really want to <Text style={styles.boldText}>DELETE</Text> this business?
                    </Text>
                    <View style={styles.buttonContainer1}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={confirmDelete}
                      >
                        <Text style={styles.buttonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setDeleteBusinessModal(false)}
                      >
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
            <Modal
              visible={isEditing}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setIsEditing(false)}>
              <View style={styles.modalContainer}>
                <View style={styles.modal}>
                  <View style={styles.textContainer}>
                    <Text style={styles.editText}>Edit Business Details</Text>

                      <TouchableOpacity onPress={deleteBusiness} style={styles.deleteBusinessContainer}>
                      <Image
                        style={styles.deleteBusinessButton}
                        source={require('../assets/delete.png')}
                      />
                      </TouchableOpacity>
                  </View>
                  <Text style={styles.textTitle}>Cover Photo:</Text>

                  <TouchableOpacity onPress={uploadImage}>
                    <Image
                      source={{
                        uri: editedImage || pins.image?.url, // Use editedImage or fallback to original image.url
                      }}
                      style={styles.changeImage}
                    />
                  </TouchableOpacity>

                  <Text style={styles.textTitle}>Location:</Text>

                  {/* Map View inside the modal */}
                  <View
                    style={{
                      width: '100%',
                      height: 200,
                      borderWidth: 2,
                      borderColor: '#017E5E',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}>
                    <MapView
                      provider={PROVIDER_GOOGLE}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      initialRegion={{
                        latitude: latitude,
                        longitude: longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      onPress={handleMapPress}>
                      <Marker
                        coordinate={{
                          latitude: latitude,
                          longitude: longitude,
                        }}
                        draggable
                        onDragEnd={e => {
                          const {latitude: newLat, longitude: newLng} =
                            e.nativeEvent.coordinate;
                          setLatitude(newLat);
                          setLongitude(newLng);
                        }}
                      />
                    </MapView>
                  </View>

                  {/* Form Inputs */}

                  <Text style={styles.textTitle}>Description:</Text>
                  <TextInput
                    onChangeText={setEditableDescription}
                    multiline={true}
                    numberOfLines={4}
                    placeholder="Description"
                    style={styles.descriptionInput}
                  />

                  <Text style={styles.textTitle}>Phone Number:</Text>

                  <TextInput
                    onChangeText={setEditablePhone}
                    placeholder="Phone"
                    style={styles.descriptionInput}
                    keyboardType="phone-pad"
                    maxLength={15}
                    textContentType="telephoneNumber"
                  />

                  <Text style={styles.textTitle}>Email:</Text>

                  <TextInput
                    onChangeText={setEditableEmail}
                    placeholder="Email"
                    style={styles.descriptionInput}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />

                  {/* Save and Cancel buttons */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <TouchableOpacity
                      onPress={handleSavePin}
                      style={{
                        padding: 10,
                        backgroundColor: 'green',
                        borderRadius: 5,
                      }}>
                      <Text style={{color: 'white'}}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={closeModals}
                      style={{
                        padding: 10,
                        backgroundColor: 'red',
                        borderRadius: 5,
                      }}>
                      <Text style={{color: 'white'}}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Button to Open Modal */}
            {user._id === pins.createdBy ? (
              <TouchableOpacity onPress={openModals}>
                <Image
                  style={styles.editImage}
                  source={require('../assets/editImage.png')}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={openModalReport}>
                <Image
                  style={styles.editImage}
                  source={require('../assets/report.png')}
                />
              </TouchableOpacity>
            )}
            {openModal && (
              <View>
                <Modal
                  animationType="fade"
                  transparent={true}
                  visible={openModal}
                  onRequestClose={handleCancelReport}>
                  <View style={styles.modalBackground1}>
                    <View style={styles.modalContent1}>
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

          <View style={styles.infoContainer}>
            <View style={styles.information}>
              <Image
                style={styles.infoImage}
                source={require('../assets/people.png')}
              />
              <Text style={styles.infoText}>{visitorLength}</Text>
            </View>
            <View style={styles.information}>
              <Image
                style={styles.starImage}
                source={require('../assets/rating.png')}
              />
              <Text style={styles.infoText}>{averageRating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.businessInfoContainer}>
              <View style={styles.businessInfo}>
                <View style={styles.businessProfile}>
                  <Image
                    style={styles.profilePic}
                    source={{uri: pins.image.url}}
                  />
                  {localPin?.isVerified && (
                    <View style={styles.verifiedContainer}>
                      <Image
                        style={styles.verifiedImage}
                        source={require('../assets/verified.png')}
                      />
                    </View>
                  )}

                  {/* Modal for Unverified Pins */}
                  <Modal
                    visible={showModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowModal(false)}>
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent2}>
                        <Image
                          style={styles.warning}
                          source={require('../assets/warning.png')}
                        />
                        <Text style={styles.modalText}>
                          This business is not verified.
                        </Text>
                        <Text style={styles.modalText}>
                          Please proceed at your own risk.
                        </Text>
                        <TouchableOpacity
                          style={styles.continueButton}
                          onPress={() => setShowModal(false)}>
                          <Text style={styles.buttonText}>Continue</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </View>
                <View>
                  <View style={styles.businessNameContainer}>
                    <Text style={styles.businessName}>{pins.businessName}</Text>
                  </View>
                  <View style={styles.businessLocationContainer}>
                    <Image
                      style={styles.grayImage}
                      source={require('../assets/markerGray.png')}
                    />
                    <Text style={styles.businessLocation}>
                      {address || 'Loading...'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.followButtons}>
                <TouchableOpacity onPress={handleFollowPress}>
                  <Text
                    style={
                      isFollowed
                        ? styles.followButtonFollowed
                        : styles.followButton
                    }>
                    {isFollowed ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('Details')}>
              <Text
                style={activeTab === 'Details' ? styles.activeTab : styles.tab}>
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Posts')}>
              <Text
                style={activeTab === 'Posts' ? styles.activeTab : styles.tab}>
                Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Media')}>
              <Text
                style={activeTab === 'Media' ? styles.activeTab : styles.tab}>
                Media
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Reviews')}>
              <Text
                style={activeTab === 'Reviews' ? styles.activeTab : styles.tab}>
                Reviews
              </Text>
            </TouchableOpacity>
            {pins.createdBy === user._id && (
              <TouchableOpacity onPress={() => setActiveTab('Analytics')}>
                <Text
                  style={
                    activeTab === 'Analytics' ? styles.activeTab : styles.tab
                  }>
                  Analytics
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {activeTab === 'Details' && (
            <View>
              <Text style={styles.description}>
                <Text style={styles.description}>
                  {editableDescription ? editableDescription : pinDescription}
                </Text>
              </Text>

              <View style={[styles.section, {height: 250}]}>
                <View style={styles.contactInfoContainer}>
                  <Text style={styles.contact}>Contacts</Text>
                  <View style={styles.contactContainer}>
                    <View style={styles.contactContactContainer}>
                      <TouchableOpacity style={styles.submitButtonContainer} onPress={handleEmailClick}>
                        <Image
                          style={styles.contactImage}
                          source={require('../assets/email.png')}
                        />
                        <Text style={styles.contactInfoText}>
                          {editableEmail ? editableEmail : pinContactInfo.email}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.contactContactContainer}>
                      <TouchableOpacity style={styles.submitButtonContainer}onPress={handlePhoneClick}>
                        <Image
                          style={styles.contactImage}
                          source={require('../assets/phone.png')}
                        />
                        <Text style={styles.contactInfoText}>
                          {editablePhone ? editablePhone : pinContactInfo.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'Posts' && (
            <View>
              {postData &&
                postData.map((item: any) => (
                  <PostCard
                    navigation={navigation}
                    key={item._id}
                    item={item}
                  />
                ))}
              {postData.length === 0 && (
                <Text style={styles.noPostText}>No Post yet!</Text>
              )}
            </View>
          )}
          {activeTab === 'Media' && (
            <View style={styles.mediaContainer}>
              {postData.length > 0 ? (
                postData.map((item: any) =>
                  item.image?.url ? (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => handleImageClick(item.image.url)}>
                      <Image
                        source={{uri: item.image.url}}
                        style={styles.mediaImage}
                      />
                    </TouchableOpacity>
                  ) : null,
                )
              ) : (
                <Text style={styles.noPostText}>No Media yet!</Text>
              )}

              <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}>
                <TouchableOpacity
                  style={styles.modalBackground}
                  onPress={closeModal}>
                  <View style={styles.modalContent}>
                    {selectedImage && (
                      <Image
                        source={{uri: selectedImage}}
                        style={styles.modalImage}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          )}
          {activeTab === 'Reviews' && (
            <View>
              <ScrollView>
                <View style={styles.reviewStarContainer}>
                  <Text style={styles.reviewStar}>
                    {safeAverageRating.toFixed(1)}
                  </Text>
                  {getStarImage(safeAverageRating) && (
                    <Image
                      source={getStarImage(safeAverageRating)}
                      style={styles.starImage1}
                    />
                  )}
                  <Text style={styles.reviewCount}>
                    Based on {reviews.length}{' '}
                    {reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
                <View style={styles.ratingDistributionContainer}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Excellent</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.excellent}%`,
                          height: 4,
                          backgroundColor: '#4CAF50',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Good</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.good}%`,
                          height: 4,
                          backgroundColor: '#8BC34A',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Average</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.average}%`,
                          height: 4,
                          backgroundColor: '#FFEB3B',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Below Average</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.belowAverage}%`,
                          height: 4,
                          backgroundColor: '#FF9800',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Poor</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.poor}%`,
                          height: 4,
                          backgroundColor: '#F44336',
                        }}
                      />
                    </View>
                  </View>
                </View>

                {reviews.length > 0 ? (
                  reviews.map(review => (
                    <View key={review._id} style={styles.reviewCard}>
                      <View style={styles.reviewContainer}>
                        <View style={styles.reviewTitleContainer}>
                          <Image
                            style={styles.reviewImage}
                            source={{uri: review.image}}
                          />
                          <View style={styles.reviewNameContainer}>
                            <Text style={styles.reviewName}>{review.name}</Text>
                            <View style={styles.ratingContainer}>
                              <Text style={styles.ratingStars}>
                                {'⭐'.repeat(Math.floor(review.ratings))}
                              </Text>
                              <Text style={styles.ratingValue}>
                                {' '}
                                {review.ratings.toFixed(1)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.dayContainer}>
                          <TouchableOpacity
                            onPress={() => toggleOptions(review._id)}>
                              <Image
                                style={styles.optionImage}
                                source={require('../assets/options.png')}
                              />
                            </TouchableOpacity>

                          <Text style={styles.daysAgo}>
                            {getDaysAgo(review.createdAt)}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.reviewText}>{review.reviewText}</Text>

                      {visibleOptions === review._id &&
                        review.userId === user._id && (
                          <View style={styles.buttonGroup}>
                            <TouchableOpacity
                              style={styles.modifyButton}
                              onPress={() => {
                                setNewReview(review.reviewText);
                                setNewRating(review.ratings.toString());
                                setSelectedReviewId(review._id);
                                setVisibleOptions(null);
                              }}>
                              <Text style={styles.buttonText}>Modify</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteReview(review._id)}>
                              <Text style={styles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noReviewsText}>No reviews available</Text>
                )}

                {!hasUserReviewed && !selectedReviewId && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your review"
                      value={newReview}
                      onChangeText={setNewReview}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter rating (1-5)"
                      keyboardType="numeric"
                      value={newRating}
                      onChangeText={text => {
                        const numericValue = parseInt(text, 10);
                        if (
                          !isNaN(numericValue) &&
                          numericValue >= 1 &&
                          numericValue <= 5
                        ) {
                          setNewRating(text);
                        } else if (text === '') {
                          setNewRating('');
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={handleAddReview}>
                      <Text style={styles.reviewButtonText}>Add Review</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedReviewId && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Modify your review"
                      value={newReview}
                      onChangeText={setNewReview}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Modify rating (1-5)"
                      keyboardType="numeric"
                      value={newRating}
                      onChangeText={text => {
                        const numericValue = parseInt(text, 10);
                        if (
                          !isNaN(numericValue) &&
                          numericValue >= 1 &&
                          numericValue <= 5
                        ) {
                          setNewRating(text);
                        } else if (text === '') {
                          setNewRating('');
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={handleModifyReview}>
                      <Text style={styles.reviewButtonText}>Modify Review</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
          {activeTab === 'Analytics' && (
            <View style={{padding: 20}}>
              <Text style={{fontSize: 20, fontWeight: 'bold'}}>
                Weekly Visitor Analytics
              </Text>
              <BarChart
                data={{
                  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  datasets: [
                    {
                      data: weeklyVisitorCounts, // Use the counts directly
                    },
                  ],
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#ffa726',
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />

             

              <Text style={{fontSize: 20, fontWeight: 'bold', marginTop: 20}}>
                Weekly Likes and Replies Analytics
              </Text>

              <StackedBarChart
                data={{
                  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  data: [
                    [likesData[0], repliesData[0]],
                    [likesData[1], repliesData[1]],
                    [likesData[2], repliesData[2]],
                    [likesData[3], repliesData[3]],
                    [likesData[4], repliesData[4]],
                    [likesData[5], repliesData[5]],
                    [likesData[6], repliesData[6]],
                  ],
                  barColors: ['rgba(255, 0, 0, 1)', 'rgba(0, 0, 255, 1)'],
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  
  deleteText:{
    textAlign: 'center',
    fontSize: 15,
  },
  buttonContainer1:{
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  deleteBusinessModal:{
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteBusinessContainer:{
    position: 'absolute',
    top: -10,
    left: 70,
  },
  deleteBusinessButton:{
    height: 30,
    resizeMode: 'contain',
  },
  submitButtonContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#017E5E',
    margin: 5,
    padding: 5,
    borderRadius: 5,
    textAlignVertical: 'top',
  },
  textTitle: {
    marginTop: 5,
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '600',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  editText: {
    color: '#017E5E',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomColor: '#017E5E',
    borderBottomWidth: 2,
    width: '80%',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  continueButton: {
    marginTop: 10,
    backgroundColor: '#017E5E',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warning: {
    height: 50,
    width: 50,
  },
  modalText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent2: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A9A9A9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },

  modifyButton: {
    backgroundColor: '#017E5E',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  reviewButton: {
    backgroundColor: '#017E5E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  reviewContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionImage: {
    height: 20,
    resizeMode: 'contain',
    marginLeft: 'auto',
  },
  reviewCard: {
    margin: 20,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    borderColor: '#A9A9A9',
  },
  ratingDistributionContainer: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingLabel: {
    width: 120,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    overflow: 'hidden',
  },

  ratingContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  reviewNameContainer: {
    marginLeft: 10,
  },
  reviewImage: {
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  reviewName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  ratingValue: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
  reviewTitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStarContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  reviewStar: {
    fontWeight: 'bold',
    fontSize: 30,
  },

  reviewCount: {
    color: '#696969',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#017E5E',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },

  confirmButton1: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },

  modalBackground1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent1: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
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
    color: '#017E5E',
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
  imageEdit: {
    width: 100,
    height: 100,
    flex: 0,
  },
  editForm: {
    backgroundColor: '#fff',
    padding: 20,
    flex: 2,
    position: 'absolute',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
  },

  cancelButton1: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
  },

  reviewsContainer: {
    padding: 20,
  },
  reviewsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reviewItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  reviewText: {
    fontSize: 16,
    marginTop: 15,
  },
  reviewRating: {
    fontSize: 14,
    color: '#666',
  },
  reviewActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  addReviewContainer: {
    marginTop: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: 100,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noReviewsText: {
    fontSize: 15,
    color: '#666',
    alignSelf: 'center',
    marginVertical: 0,
  },
  modalBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noPostText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
    width: '100%',
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  mediaImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 8,
  },
  contactInfoText: {
    marginLeft: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contactInfoContainer: {
    alignItems: 'center',
  },
  contactImage: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  contact: {
    marginTop: 10,
    fontSize: 15,
    color: '#017E5E',
    fontWeight: 'bold',
  },
  contactContactContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '45%',
  },
  contactContainer: {
    marginTop: 10,
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  scrollContainer: {
    paddingTop: 0,
  },
  goBackContainer: {
    backgroundColor: '#fff',
    padding: 14,
    left: 15,
    borderRadius: 50,
    position: 'absolute',
    top: -220,
    opacity: 0.9,
  },
  goBackButton: {
    width: 28,
    height: 28,
  },
  imageHolder: {
    height: 280,
    width: Dimensions.get('window').width,
    alignSelf: 'stretch',
    resizeMode: 'cover',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  image: {
    height: 280,
    width: Dimensions.get('window').width,
    alignSelf: 'stretch',
    resizeMode: 'cover',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  changeImage: {
    height: 150,
    alignSelf: 'stretch',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: MAX_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTitle: {
    color: 'white',
    backgroundColor: 'transparent',
    fontSize: 24,
  },
  title: {
    fontSize: 20,
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
  },
  sectionContent: {
    fontSize: 16,
    textAlign: 'justify',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  categoryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FF6347',
    borderRadius: 20,
    margin: 10,
    padding: 10,
    paddingHorizontal: 15,
  },
  category: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
  },
  navTitleView: {
    height: MIN_HEIGHT,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 5,
    backgroundColor: 'transparent',
  },
  navTitle: {
    color: 'black',
    fontSize: 28,
    backgroundColor: 'transparent',
    paddingLeft: 20,
    margin: 5,
  },
  sectionLarge: {
    minHeight: 150,
  },
  editImageContainer: {
    position: 'absolute',
    top: -220,
    left: '85%',
    zIndex: 1,
  },
  editImage: {
    height: 40,
    width: 40,
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    position: 'absolute',
    top: -50,
    left: '45%',
  },
  information: {
    display: 'flex',
    flexDirection: 'row',
    width: 90,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
  },
  infoImage: {
    height: 18,
    width: 18,
  },
  starImage: {
    height: 18,
    width: 18,
  },
  starImage1: {
    height: 100,
    resizeMode: 'contain',
  },
  infoText: {
    fontWeight: '700',
  },
  businessLocationContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedContainer: {
    position: 'absolute',
    top: 50,
    left: 45,
  },
  verifiedImage: {
    height: 30,
    width: 30,
  },
  grayImage: {
    marginRight: 5,
    height: 15,
    width: 15,
  },
  businessLocation: {
    color: '#6E6E6E',
    fontWeight: 'bold',
  },
  businessNameContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessInfo: {
    display: 'flex',
    flexDirection: 'row',
    width: '45%',
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  businessProfile: {
    marginRight: 10,
  },
  followButtons: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  followButton: {
    borderColor: '#cecece',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 20,
    fontSize: 15,
    borderRadius: 50,
    backgroundColor: '#017E5E',
    color: '#FFFFFF',
  },

  followButtonFollowed: {
    borderColor: '#cecece',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 20,
    fontSize: 15,
    borderRadius: 50,
    backgroundColor: '#fff',
    color: '#017E5E',
  },
  markerImage: {
    height: 35,
    width: 35,
  },
  profilePic: {
    height: 70,
    width: 70,
    borderRadius: 100,
  },
  tabsContainer: {
    marginTop: 15,
    display: 'flex',
    width: '100%',
    justifyContent: 'space-around',
    flexDirection: 'row',
    borderBottomColor: '#cccccc',
    borderBottomWidth: 1,
  },
  activeTab: {
    color: '#017E5E',
    fontWeight: 'medium',
    borderBottomColor: '#017E5E',
    borderBottomWidth: 1,
    width: '100%',
    fontSize: 20,
  },
  tab: {
    fontSize: 20,
    paddingBottom: 10,
    fontWeight: 'lightweight',
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 17,
    textAlign: 'justify',
    margin: 15,
  },
  contactInfo: {
    fontFamily: 'Roboto',
    fontSize: 17,
    textAlign: 'justify',
    marginLeft: 15,
  },
  boldText: {
    fontWeight: 'bold',
    color: 'red',
  },
});

export default BusinessPinScreen;
