


import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, MapPressEvent } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Coordinate, RunMarker } from '../types';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../../App';
import CreateRunModal from '../components/CreateRunModal';
import SearchBar from '../components/SearchBar';

const LAST_REGION_KEY = 'lastMapRegion';

type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Map'>;

export default function MapScreen() {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const markerPressedRef = useRef(false);
  const [region, setRegion] = useState({
    latitude: 35.6762, // 東京（デフォルト）
    longitude: 139.6503,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markers, setMarkers] = useState<RunMarker[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Coordinate | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);

  useEffect(() => {
    // 初期化処理
    (async () => {
      try {
        // 保存された位置を読み込み
        const savedRegion = await AsyncStorage.getItem(LAST_REGION_KEY);
        if (savedRegion) {
          const parsed = JSON.parse(savedRegion);
          setRegion(parsed);
          fetchNearbyRuns(parsed.latitude, parsed.longitude);
        }

        // 位置情報の許可を取得
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('位置情報の許可が必要です');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coords);

        // 保存された位置がない場合のみ、現在地にセット
        if (!savedRegion) {
          const newRegion = {
            ...coords,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setRegion(newRegion);
          fetchNearbyRuns(coords.latitude, coords.longitude);
        }
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('位置情報エラー', '位置情報の取得に失敗しました');
      }
    })();

    // リアルタイム更新を購読
    const channel = supabase
      .channel('runs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'runs',
        },
        (payload) => {
          console.log('New run added:', payload.new);
          // 新しい募集を追加
          addMarkerFromRun(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNearbyRuns = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.rpc('nearby_runs', {
        lat,
        lng,
        radius_km: 10,
      });

      if (error) throw error;

      const now = new Date();
      const runMarkers: RunMarker[] = data
        .filter((run: any) => new Date(run.datetime) > now) // 未来のRunのみ
        .map((run: any) => {
          // PostGISのPOINT形式から座標を抽出
          const coords = parseLocation(run.location);
          return {
            id: run.id,
            coordinate: coords,
            location_name: run.location_name,
            datetime: run.datetime,
            description: run.description,
            note: run.note,
            thanks_count: run.thanks_count,
          };
        });

      setMarkers(runMarkers);
    } catch (error) {
      console.error('Error fetching nearby runs:', error);
    }
  };

  const addMarkerFromRun = (run: any) => {
    // 過去のRunは追加しない
    if (new Date(run.datetime) <= new Date()) {
      return;
    }

    const coords = parseLocation(run.location);
    const newMarker: RunMarker = {
      id: run.id,
      coordinate: coords,
      location_name: run.location_name,
      datetime: run.datetime,
      description: run.description,
      note: run.note,
      thanks_count: run.thanks_count,
    };
    // 重複チェック: 既に存在するIDなら追加しない
    setMarkers((prev) => {
      if (prev.some((marker) => marker.id === newMarker.id)) {
        return prev;
      }
      return [...prev, newMarker];
    });
  };

  // PostGISのPOINT形式 "POINT(lng lat)" から座標を抽出
  const parseLocation = (location: string): Coordinate => {
    const match = location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (match) {
      return {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2]),
      };
    }
    return { latitude: 0, longitude: 0 };
  };

  const handleMapPress = (event: MapPressEvent) => {
    // マーカーがタップされた直後なら無視（run登録フォームを開かない）
    if (markerPressedRef.current) {
      markerPressedRef.current = false;
      return;
    }

    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setModalVisible(true);
  };

  const handleMarkerPress = (marker: RunMarker) => {
    // マーカーがタップされたことを記録
    markerPressedRef.current = true;

    // run詳細画面に遷移
    navigation.navigate('RunDetail', {
      runId: marker.id,
      description: marker.description,
      datetime: marker.datetime,
      location_name: marker.location_name,
      note: marker.note,
    });
  };

  const handleCreateSuccess = () => {
    // 現在地の近くのrunを再取得
    if (currentLocation) {
      fetchNearbyRuns(currentLocation.latitude, currentLocation.longitude);
    }
  };

  const handleLocationSearch = (latitude: number, longitude: number) => {
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setRegion(newRegion);
    // 地図をアニメーション付きで移動
    mapRef.current?.animateToRegion(newRegion, 1000);
    // 新しい位置の近くのrunを取得
    fetchNearbyRuns(latitude, longitude);
  };

  const handleRegionChangeComplete = async (newRegion: any) => {
    // 地図の位置が変わったら保存
    try {
      await AsyncStorage.setItem(LAST_REGION_KEY, JSON.stringify(newRegion));
    } catch (error) {
      console.error('Failed to save region:', error);
    }
  };

  return (
    <View style={styles.container}>
      <SearchBar onLocationSelect={handleLocationSearch} />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            onPress={() => handleMarkerPress(marker)}
            tracksViewChanges={false}
          >
            <View style={styles.customMarkerContainer}>
              <View style={styles.customMarkerCallout}>
                <Text style={styles.calloutTitle} numberOfLines={2}>
                  {marker.description}
                </Text>
                <Text style={styles.calloutTime}>
                  {new Date(marker.datetime).toLocaleString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.customMarkerPin}>
                <View style={styles.pinDot} />
              </View>
            </View>
          </Marker>
        ))}
        {selectedLocation && modalVisible && (
          <Marker
            coordinate={selectedLocation}
            pinColor="blue"
            title="投稿場所"
          />
        )}
      </MapView>

      {/* 投稿ボタン */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setSelectedLocation(currentLocation);
          setModalVisible(true);
        }}
      >
        <Text style={styles.createButtonText}>+ Run を投稿</Text>
      </TouchableOpacity>

      {/* 投稿モーダル */}
      <CreateRunModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedLocation(null);
        }}
        selectedLocation={selectedLocation}
        onSuccess={handleCreateSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  createButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  callout: {
    padding: 8,
    minWidth: 120,
    maxWidth: 200,
  },
  calloutTooltip: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  calloutTime: {
    fontSize: 11,
    color: '#666',
  },
  customMarkerContainer: {
    alignItems: 'center',
  },
  customMarkerCallout: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 4,
  },
  customMarkerPin: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    position: 'absolute',
    top: 2,
  },
});
