// src/components/CameraButton.js
import React from 'react';
import {Button, StyleSheet} from 'react-native';

const CameraButton = ({onPress, label}) => {
    return (
        <Button title={label} onPress={onPress} style={styles.button}/>
    );
};

const styles = StyleSheet.create({
    button: {
        marginBottom: 20,
    },
});

export default CameraButton;
