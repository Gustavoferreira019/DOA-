import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, Linking, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons'; 
import React, { Component } from 'react';


const API_KEY = 'AIzaSyA06-5ohexOMolcROXBcdT_5M8tbh0-v7';//Q

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      location: null,
      loading: true,
      places: [],
      selectedPlace: null,
      isMenuVisible: false,
      showDirectionsButton: false,
      selectedPlaceCoords: null,
      openingHours: null,
      phoneNumber: null,
      searchRadius: 10000, // Valor padrão do raio de busca
    };
  }

  componentDidMount() {
    this.getLocation();
  }

  getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permissão de localização negada');
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      this.setState({ location: currentLocation.coords, loading: false });

      this.mapRef.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      this.setState({ loading: false });
    }
  };

  fetchPlaces = async () => {
    const { location, searchRadius } = this.state;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${searchRadius}&type=health&keyword=blood%20donation&key=${API_KEY}`
      );
      const data = await response.json();
      this.setState({ places: data.results });
    } catch (error) {
      console.error('Erro ao buscar lugares:', error);
    }
  };

  toggleMenu = () => {
    this.setState((prevState) => ({ isMenuVisible: !prevState.isMenuVisible }));
  };

  selectPlace = async (place) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,vicinity,opening_hours,formatted_phone_number&key=${API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        const { name, vicinity, opening_hours, formatted_phone_number } = data.result;
        this.setState({
          selectedPlace: { name, vicinity },
          openingHours: opening_hours,
          phoneNumber: formatted_phone_number,
          isMenuVisible: true,
          showDirectionsButton: true,
          selectedPlaceCoords: place.geometry.location,
        });
      } else {
        console.error('Erro ao obter detalhes do local:', data.status);
      }
    } catch (error) {
      console.error('Erro ao obter detalhes do local:', error);
    }
  };

  openDirections = () => {
    const { selectedPlaceCoords } = this.state;
    if (selectedPlaceCoords) {
      const { lat, lng } = selectedPlaceCoords;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  convertToBrasiliaTime = (time) => {
    if (time.toLowerCase().includes('fechado')) {
      return 'Fechado';
    }
    
    const match = time.match(/(\d{1,2}):(\d{2}) (\w{2})/);
    if (match) {
      let [, hour, min, ampm] = match;
      hour = parseInt(hour, 10);
      if (ampm === 'PM' && hour < 12) {
        hour += 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      hour = (hour + 3) % 24;
      return `${hour}:${min}`;
    } else {
      return time;
    }
  };

  render() {
    const { location, loading, places, selectedPlace, isMenuVisible, showDirectionsButton, openingHours, phoneNumber } = this.state;
    return (
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            {location && (
              <MapView
                ref={(ref) => { this.mapRef = ref; }}
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                toolbarEnabled={false} 
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  pinColor="blue" 
                />
                {places.map((place, index) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: place.geometry.location.lat,
                      longitude: place.geometry.location.lng,
                    }}
                    onPress={() => {
                      this.selectPlace(place);
                    }}
                  />
                ))}
              </MapView>
            )}

            <Text style={styles.logoText}>DOA+</Text>

            <TouchableOpacity
              onPress={this.getLocation} 
              style={styles.locationButtonContainer}
            >
              <MaterialIcons name="my-location" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => this.fetchPlaces(20000)} // Exemplo: busca de 20km
              style={[styles.button, { backgroundColor: '#800000', marginBottom: 10 }]}
            >
              <Text style={styles.buttonText}>Buscar Postos de Coleta de Sangue</Text>
            </TouchableOpacity>
          </>
        )}

        <Modal
          visible={isMenuVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={this.toggleMenu}
        >
          <View style={styles.menu}>
            <TouchableOpacity style={styles.closeButton} onPress={this.toggleMenu}>
              <Text style={[styles.closeButtonText, { color: '#800000' }]}>Fechar</Text>
            </TouchableOpacity>
            <Text style={styles.menuText}>{selectedPlace?.name}</Text>
            <Text style={styles.menuText}>{selectedPlace?.vicinity}</Text>
            {phoneNumber && (
              <Text style={styles.menuText}>Telefone: {phoneNumber}</Text>
            )}
            {openingHours && (
              <View style={styles.openingHoursContainer}>
                <Text style={styles.openingHoursTitle}>Horários de Funcionamento:</Text>
                {openingHours?.weekday_text.map((time, index) => (
                  <Text key={index} style={styles.openingHoursText}>{this.convertToBrasiliaTime(time.replace('Monday', 'Segunda-feira').replace('Tuesday', 'Terça-feira').replace('Wednesday', 'Quarta-feira').replace('Thursday', 'Quinta-feira').replace('Friday', 'Sexta-feira').replace('Saturday', 'Sábado').replace('Sunday', 'Domingo'))}</Text>
                ))}
              </View>
            )}
            {showDirectionsButton && (
              <TouchableOpacity style={styles.directionsButton} onPress={this.openDirections}>
                <Text style={styles.directionsButtonText}>Como Chegar</Text>
              </TouchableOpacity>
            )}
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE', 
  },
  map: {
    flex: 1, 
    width: '100%',
  },
  menu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeButtonText: {
    color: 'blue',
    fontWeight: 'bold',
  },
  menuText: {
    fontSize: 16,
    marginBottom: 10,
  },
  openingHoursContainer: {
    marginTop: 10,
  },
  openingHoursTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  openingHoursText: {
    fontSize: 14,
  },
  directionsButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  directionsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#800000',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  locationButtonContainer: {
    position: 'absolute',
    bottom: 90, 
    right: 10, 
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
  },
  logoText: {
    position: 'absolute',
    top: 150,
    color: '#800000',
    fontWeight: 'bold',
    fontSize: 32,
    zIndex: 1,
  },
});
