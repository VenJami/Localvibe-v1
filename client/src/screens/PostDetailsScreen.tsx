import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import PostDetailsCard from '../components/PostDetailsCard';
import { useSelector } from 'react-redux';
import PostCard from '../components/PostCard';

type Props = {
  navigation: any;
  route: any;
};

const PostDetailsScreen = ({ navigation, route }: Props) => {
  let item = route.params.data;
  const { posts } = useSelector((state: any) => state.post);
  const [data, setData] = useState(item);

  useEffect(() => {
    if (posts) {
      const d = posts.find((i: any) => i._id === item._id);
      setData(d);
    }
  }, [posts]);

  return (
    <SafeAreaView>
      <StatusBar backgroundColor="#F1FFF8" barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.scrollContainer}>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/2223/2223615.png',
                }}
                style={{height: 25, width: 25}}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <PostCard navigation={navigation} item={data} postId={data._id} />
            <View style={styles.mainCommentContainer}>
              <View style={styles.commentsContainer}>
                {data?.replies?.map((i: any, index: number) => (
                  <PostCard
                    navigation={navigation}
                    item={i}
                    key={index}
                    isReply={true}
                    postId={item._id}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() =>
              navigation.replace('CreateReplies', {
                item: item,
                navigation: navigation,
              })
            }>
            <Image
              source={{uri: item.user.avatar.url}}
              style={styles.replyImage}
            />
            <Text style={styles.replyText}>Reply to {item.user.name}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  commentsContainer: {
    borderColor: '#000',
    borderLeftWidth: 1,
    marginLeft: 30,
  },
  container: {
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#fff', // Equivalent to bg-teal-50
  },
  scrollContainer: {
    height: '102%',
  },
  iconContainer: {
    paddingHorizontal: 12,
    marginTop: 12,
  },
  replyContainer: {
    marginBottom: 150,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    backgroundColor: 'white',
    height: 70,
    alignItems: 'center',
  },
  replyButton: {
    width: '92%',
    backgroundColor: '#F1FFF8',
    height: 45,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyImage: {
    marginLeft: 12,
    marginRight: 12,
    width: 30,
    height: 30,
    borderRadius: 50,
  },
  replyText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.61)', // Equivalent to text-[#0000009b]
  },
});

export default PostDetailsScreen;
