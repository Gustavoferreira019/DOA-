import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity,Image } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao DOA+</Text>
      <Image style={styles.image} source={require('./img/doacaoLogo.avif')}/>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('App')}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
    color:'#800000',
  },
  button: {
    backgroundColor: '#800000',
    paddingVertical: 20,
    paddingHorizontal: 150,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize:18,
  },
  image: {
    width:200,
    height: 265,
    marginVertical:50,

  }
});

export default WelcomeScreen;
