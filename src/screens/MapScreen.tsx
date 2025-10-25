import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Coordinate, RunMarker } from '../types';
import { supabase } from '../lib/supabase';
import CreateRunModal from '../components/CreateRunModal';

export default function MapScreen() {
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
    // 位置情報の許可を取得
    (async () => {
      try {
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
        setRegion({
          ...coords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        // 近くの募集を取得
        fetchNearbyRuns(coords.latitude, coords.longitude);
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

      const runMarkers: RunMarker[] = data.map((run: any) => {
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
    setMarkers((prev) => [...prev, newMarker]);
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
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setModalVisible(true);
  };

  const handleCreateSuccess = () => {
    // 現在地の近くのrunを再取得
    if (currentLocation) {
      fetchNearbyRuns(currentLocation.latitude, currentLocation.longitude);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation
        showsMyLocationButton
        onPress={handleMapPress}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.description}
            description={`${marker.location_name || ''}\n${new Date(marker.datetime).toLocaleString()}`}
          />
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
});
