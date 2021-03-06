import React from 'react';
import {
  Avatar,
  withTheme,
  Card,
  Title,
  Paragraph,
  List,
} from 'react-native-paper';
import HTML from 'react-native-render-html';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Share,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import NetInfo from '@react-native-community/netinfo';
const cacheKey = 'CacheData';
import NetworkStatus from '../components/NetworkStatus';
class SinglePost extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isloading: true,
      post: [],
      already_bookmark: false,
      offline: false,
    };
  }
  static navigationOptions = {
    headerStyle: {
      backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };
  componentDidMount() {
    this.fetchPost().then(() => {
      this.renderBookMark(this.props.navigation.getParam('post_id'));
    });
  }
  renderBookMark = async post_id => {
    await AsyncStorage.getItem('bookmark').then(token => {
      const res = JSON.parse(token);
      console.log(res);
      let data = res.find(value => value === post_id);
      return data == null
        ? this.setState({already_bookmark: false})
        : this.setState({already_bookmark: true});
    });
  };
  saveBookMark = async post_id => {
    this.setState({already_bookmark: true});
    await AsyncStorage.getItem('bookmark').then(token => {
      const res = JSON.parse(token);
      if (res !== null) {
        let data = res.find(value => value === post_id);
        if (data == null) {
          res.push(post_id);
          AsyncStorage.setItem('bookmark', JSON.stringify(res));
        }
      } else {
        let bookmark = [];
        bookmark.push(post_id);
        AsyncStorage.setItem('bookmark', JSON.stringify(bookmark));
      }
    });
  };
  onShare = async (title, uri) => {
    Share.share({
      title: title,
      url: uri,
    });
  };
  async fetchPost() {
    let post_id = this.props.navigation.getParam('post_id');
    const networkState = await NetInfo.fetch();

    if (!networkState.isConnected) {
      const _cachedData = await AsyncStorage.getItem(cacheKey);
      const cachedData = JSON.parse(_cachedData);
      console.log(cachedData);
      if (!cachedData) {
        alert("You're currently offline and no local data was found.");
      } else {
        alert('Your are offline but still have cache data');
      }
      let post = cachedData.post.filter(value => value.id === post_id);

      this.setState({
        post: post,
        isloading: false,
        offline: true,
      });
    } else {
      const response = await fetch(
        `http://kriss.pro/wp-json/wp/v2/posts?_embed&include=${post_id}`,
      );
      const post = await response.json();
      this.setState({
        post: post,
        isloading: false,
      });
    }
  }

  render() {
    let post = this.state.post;
    const {colors} = this.props.theme;
    if (this.state.isloading) {
      return (
        <View
          style={{
            paddingVertical: 20,
            borderTopWidth: 1,
            borderColor: '#CED0CE',
          }}>
          <ActivityIndicator animating size="large" />
        </View>
      );
    }
    return (
      <ScrollView>
        <Card>
          <Card.Content>
            <Title>{post[0].title.rendered} </Title>
            <List.Item
              title={`${
                this.state.offline ? '' : post[0]._embedded.author[0].name
              }`}
              description={`${
                this.state.offline
                  ? ''
                  : post[0]._embedded.author[0].description
              }`}
              left={props => {
                return (
                  <Avatar.Image
                    size={55}
                    source={{
                      uri: `${
                        this.state.offline
                          ? ''
                          : post[0]._embedded.author[0].avatar_urls[96]
                      }`,
                    }}
                  />
                );
              }}
              right={props => {
                return (
                  <TouchableOpacity
                    onPress={() =>
                      this.onShare(post[0].title.rendered, post[0].link)
                    }>
                    <FontAwesome name="share" size={30} color={colors.text} />
                  </TouchableOpacity>
                );
              }}
            />
            <List.Item
              title={`Published on ${moment(
                post[0].date,
                'YYYYMMDD',
              ).fromNow()}`}
              right={props => {
                if (this.state.already_bookmark == true) {
                  return (
                    <TouchableOpacity
                      onPress={() => this.removeBookMark(post[0].id)}>
                      <FontAwesome
                        name="bookmark"
                        size={30}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      onPress={() => this.saveBookMark(post[0].id)}>
                      <FontAwesome
                        name="bookmark-o"
                        size={30}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  );
                }
              }}
            />
            <Paragraph />
          </Card.Content>
          <Card.Cover source={{uri: post[0].jetpack_featured_media_url}} />
          <Card.Content>
            <HTML
              html={post[0].content.rendered}
              imagesInitialDimensions={{
                width: Dimensions.get('window').width,
                height: Dimensions.get('window').width * 2,
              }}
              tagsStyles={{
                p: {color: colors.text},
                h1: {color: colors.text},
                h2: {color: colors.text},
                h3: {color: colors.text},
                pre: {color: colors.accent},
              }}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }
}
export default withTheme(SinglePost);
