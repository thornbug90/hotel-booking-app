import React, {useEffect, useRef, useState} from 'react';
import {
  Text,
  View,
  Animated,
  PanResponder,
  useAnimatedValue,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {AppStackParamList} from '.';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import tw from '../../../tailwindcss';
import LinearGradient from 'react-native-linear-gradient';
import {Cancel, Coffee, Swimming, ToBelow} from '../../lib/images';
// import {hotelLists} from '../../lib/listTemp';
import {http, uploadPath} from '../../helpers/http';
import Loading from '../../components/Loading';
// import Animated from 'react-native-reanimated';
type Props = NativeStackScreenProps<
  AppStackParamList,
  'AppStack_HomePageScreen'
>;

interface ICardProps {
  navigation: NativeStackNavigationProp<
    AppStackParamList,
    'AppStack_HomePageScreen'
  >;
  item: any;
}
const windowsHeight = Dimensions.get('window').height;
const windowsWidth = Dimensions.get('window').width;
const HotelCard: React.FC = ({navigation, item}: ICardProps) => {
  const onPressToDetail = () => {
    if (item.isHotel) {
      navigation.navigate('AppStack_HotelDetailScreen', {item});
    } else {
      navigation.navigate('AppStack_SpotDetailScreen', {item});
    }
  };
  return (
    <TouchableOpacity onPress={onPressToDetail} activeOpacity={0.5}>
      <View
        style={tw`m-3 rounded-[13px] border-[1px] border-[#0A0A0A] bg-black flex-row`}>
        <Image
          source={{uri: uploadPath + item.images[0]}}
          style={tw`rounded-[13px] mr-2.5 w-[180px] h-[180px]`}
          width={180}
          height={180}
        />
        <View style={tw`m-3 flex-1`}>
          <Text
            style={tw`h-13 text-white font-dm font-bold text-[14px] flex-shrink mb-2 leading-[18px]`}>
            {item.name}
          </Text>
          <View style={tw`flex-row mb-1.5`}>
            <Image source={Coffee} style={tw`h-3 w-3 `} />
            <Text style={tw`text-white font-dm text-[5px] leading-4 mr-3`}>
              Free Breakfast
            </Text>
            <Image source={Swimming} style={tw`h-3 w-3`} />
            <Text style={tw`text-white font-dm text-[5px] leading-4`}>
              Swimming Pool
            </Text>
          </View>
          <View style={tw`w-7 h-4 rounded-[3px] bg-[#1BF28B] mb-0.5`}>
            <Text
              style={tw`text-black text-center font-dm text-[8px] font-bold leading-[9px]`}>
              9.5
            </Text>
            <Text
              style={tw`text-black text-center font-dm text-[5px] font-bold leading-[6px]`}>
              rating
            </Text>
          </View>
          <View style={tw`flex-col items-end`}>
            <View
              style={tw`w-8.5 h-4 rounded-[3px] bg-[#8B2500] flex-row justify-center items-center mb-2`}>
              <Text style={tw`text-white font-dm text-[8px] font-bold`}>
                {item.minimumRooms} Left
              </Text>
            </View>
            <View style={tw`flex-row gap-3`}>
              <Text
                style={tw`text-white font-dm text-[18px] line-through font-bold`}>
                ${item.minimumWasPrice}
              </Text>
              <Text style={tw`text-[#FF5C00] font-dm text-[18px] font-bold`}>
                ${item.minimumPrice}
              </Text>
            </View>
            <Text style={tw`text-white font-dm text-[5px] font-bold`}>
              not includes taxes & fees
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
const AppStack_HomePageScreen: React.FC<Props> = ({navigation, route}) => {
  const [showText, setShowText] = useState(true);
  const [hotelLists, setHotelLists] = useState([]);
  const [spotLists, setSpotLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const mousePositionRef = useRef(0);
  const directionRef = useRef(false);
  const gestureDyRef = useRef(0);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const topSheetPosition = useAnimatedValue(windowsHeight - 80);
  const topListBackgroundOpactiy = useAnimatedValue(0);
  const animatedStyle = {
    backgroundColor: topListBackgroundOpactiy.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    }),
  };
  const calculateCurrentPoint = gestureState =>
    mousePositionRef.current + gestureState.dy;

  const calculateLimitPullingHeight = () => 60;

  const setTopSheetPosition = (value, callback = () => {}) => {
    Animated.spring(topSheetPosition, {
      toValue: value,
      useNativeDriver: false,
    }).start(callback);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      mousePositionRef.current = topSheetPosition._value;
    },
    onPanResponderMove: (event, gestureState) => {
      directionRef.current = gestureDyRef.current >= gestureState.dy;
      gestureDyRef.current = gestureState.dy;

      if (showText === true && gestureState.dy < 0) {
        setShowText(false);
      }

      const currentPoint = calculateCurrentPoint(gestureState);
      const limitPullingHeight = calculateLimitPullingHeight();

      topListBackgroundOpactiy.setValue(
        (windowsHeight - currentPoint) / (windowsHeight - 60),
      );

      if (
        currentPoint > limitPullingHeight &&
        currentPoint < windowsHeight - 20
      ) {
        topSheetPosition.setValue(currentPoint);
      }
    },
    onPanResponderRelease: (event, gestureState) => {
      const currentPoint = calculateCurrentPoint(gestureState);
      const limitPullingHeight = calculateLimitPullingHeight();

      topListBackgroundOpactiy.setValue(
        (windowsHeight - currentPoint) / (windowsHeight - 60),
      );

      if (topSheetPosition._value > windowsHeight - 60) {
        setShowText(true);
        topSheetPosition.setValue(windowsHeight - 80);
      } else {
        if (directionRef.current) {
          setTopSheetPosition(limitPullingHeight, () => {
            topListBackgroundOpactiy.setValue(1);
          });
        } else {
          setTopSheetPosition(windowsHeight - 60, () => {
            setShowText(true);
            topSheetPosition.setValue(windowsHeight - 80);
            topListBackgroundOpactiy.setValue(0);
          });
        }
      }
    },
  });

  const getAllHotels = () => {
    setLoading(true);
    http
      .get('/user/all_hotels')
      .then(res => {
        setLoading(false);
        setHotelLists(
          res.data.data.map((item: any) => ({
            ...item,
            isHotel: true,
          })),
        );
      })
      .catch(err => {
        setLoading(false);
        console.log(err);
      });
  };

  const getAllSpots = () => {
    http
      .get('/user/all_spots')
      .then(res => {
        setSpotLists(
          res.data.data.map((item: any) => ({
            ...item,
            isHotel: false,
          })),
        );
      })
      .catch(err => {
        console.log(err);
      });
  };
  useEffect(() => {
    getAllSpots();
    getAllHotels();
    BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', () => {
        return true;
      });
    };
  }, []);
  useEffect(() => {
    if (route.params?.searchResult) {
      setRegion({
        latitude: route.params.searchResult.latitude,
        longitude: route.params.searchResult.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [route.params?.searchResult]);

  if (loading) return <Loading />;
  return (
    <View style={tw`flex-1 relative`}>
      <Animated.View
        style={{
          ...tw`flex-row items-start absolute top-0 left-0 pt-3 right-0 h-20 z-10`,
          ...animatedStyle,
        }}>
        <TouchableOpacity
          activeOpacity={0.5}
          style={tw`relative mx-3 mb-2`}
          onPress={() => navigation.navigate('AppStack_PriceFilterScreen')}>
          <Image source={Cancel} style={tw`w-[38px] h-[38px]`} />
          <View style={tw`absolute top-[10px] left-[10px] w-full`}>
            <Image source={ToBelow} style={tw`w-[18px] h-[18px] z-50`} />
          </View>
        </TouchableOpacity>
        {Array.from({length: 9}).map((_, index) => (
          <View style={tw`flex-1 flex-col items-center`} key={index}>
            <Image
              source={require('../../../assets/images/hotel.png')}
              width={30}
              height={30}
              style={tw`rounded-full`}
            />
            <Text
              style={tw`text-black text-center font-bold font-dm text-[8px]`}>
              Hotel
            </Text>
          </View>
        ))}
      </Animated.View>
      <View
        style={tw`absolute bottom-25 left-0 right-0 flex-row justify-center gap-10 z-20`}>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => {
            navigation.navigate('AppStack_ProfileScreen');
          }}>
          <View
            style={tw`px-3.5 py-1 flex-row justify-center items-center rounded-full bg-white h-7.5`}>
            <Text
              style={tw`text-black font-dm text-[16px] capitalize font-bold`}>
              Profile
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => {
            navigation.navigate('AppStack_HotelSearch');
          }}>
          <View
            style={tw`px-13 py-2 flex-row justify-center items-center rounded-full bg-[#222222]/50 h-7.5`}>
            <Text style={tw`text-white font-dm text-[11px] capitalize`}>
              Where to?
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <MapView
        showsCompass={false}
        mapType="standard"
        style={tw`h-full w-full`}
        provider={PROVIDER_GOOGLE}
        region={region}>
        {hotelLists.length > 0 &&
          hotelLists.map((item, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: item.position.lat,
                longitude: item.position.lng,
              }}
              title={item.name}
              description={item.description}>
              <View
                style={tw`w-7 h-4 rounded-[3px] bg-[#1E2761] flex-row justify-center items-center`}>
                <Text
                  style={tw`text-white text-[8px] text-center font-dm font-bold`}>
                  ${item.minimumPrice}
                </Text>
              </View>
            </Marker>
          ))}
        {spotLists.length > 0 &&
          spotLists.map((item, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: item.position.lat,
                longitude: item.position.lng,
              }}
              title={item.name}
              description={item.description}>
              <View
                style={tw`w-[30px] h-[30px] rounded-full border-[1px] border-[#1E2761]`}>
                <Image
                  source={{uri: uploadPath + item.images[0]}}
                  style={tw`w-full h-full rounded-full`}
                  width={30}
                  height={30}
                />
              </View>
            </Marker>
          ))}
      </MapView>
      <Animated.View
        hitSlop={{top: 0, bottom: 0, left: 0, right: 0}}
        style={{
          ...tw`absolute left-0 right-0 z-20 h-${(windowsHeight - 60) / 4}`,
          top: topSheetPosition,
        }}>
        <LinearGradient
          colors={['#FFF', '#1E2761']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={tw`rounded-t-5 flex-col items-center h-full`}>
          <View
            style={tw`min-h-[50px] w-full flex items-center justify-center`}
            {...panResponder.panHandlers}>
            <View style={tw`w-24 h-1 bg-[#93999A] rounded-full`} />
          </View>
          {showText && (
            <Text style={tw`text-black font-dm text-[16px] font-bold mb-2`}>
              Over 1000 Amazing Places
            </Text>
          )}

          <FlatList
            contentContainerStyle={tw`w-${windowsWidth / 4}`}
            data={[...hotelLists, ...spotLists]}
            keyExtractor={item => item._id.toString()}
            style={{maxHeight: windowsHeight - 180}}
            renderItem={({item}) => (
              <HotelCard navigation={navigation} item={item} />
            )}
          />
          <View
            style={tw`flex-row justify-center items-center gap-10 z-20 h-17.5`}>
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => {
                setShowText(true);
                setTopSheetPosition(windowsHeight - 80);
              }}>
              <View
                style={tw`px-3.5 py-1 flex-row justify-center items-center rounded-full bg-white h-7.5`}>
                <Text
                  style={tw`text-black font-dm text-[16px] capitalize font-bold`}>
                  Map
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => {
                navigation.navigate('AppStack_HotelSearch');
              }}>
              <View
                style={tw`px-13 py-2 flex-row justify-center items-center rounded-full bg-[#222222]/50 h-7.5`}>
                <Text style={tw`text-white font-dm text-[11px] capitalize`}>
                  Where to?
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default AppStack_HomePageScreen;
