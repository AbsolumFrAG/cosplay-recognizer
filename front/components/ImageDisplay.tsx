// src/components/ImageDisplay.js
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const ImageDisplay = ({ uri, characterName }) => {
    return (
        <View style={styles.container}>
            <Image source={{ uri }} style={styles.image} />
            {characterName && <Text style={styles.characterName}>{characterName}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginTop: 20,
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
    },
    characterName: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ImageDisplay;
