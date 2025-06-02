#include <ESP32Servo.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define lm35Pin2 26     // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11   // DHT 11
#define DHTPIN lm35Pin2   // DHT 11

DHT dht(DHTPIN, DHTTYPE);

// check difference and update cells

const char* ssid = "WIFI network SSID";     // Your WiFi network SSID
const char* password = "password"; // Your WiFi network password
const char* scriptUrl = "https://script.google.com/macros/s/key/exec"; // Replace with your script URL

void connectToWiFi();

String readData(String cell);
void sendData(String cell, String value);

// Define the pins
const int doorPirSensorPin = 39;    // Door PIR sensor pin 
const int roomPirSensorPin1 = 36;    // Room PIR sensor pin
const int roomPirSensorPin2 = 13;    // Room PIR sensor pin 
const int doorBuzzerPin = 2;        // Buzzer pin for the door PIR
const int roomBuzzerPin = 15;       // Buzzer pin for the room PIR
//const int room1LdrPin = 27;         // LDR pin for room 1 
const int room2LdrPin = 33;         // LDR pin for room 2 
const int room1LedPin = 16;         // LED pin for room 1 
const int room2LedPin = 21;         // LED pin for room 2 
const int lm35Pin1 = 26;
//const int lm35Pin2 = 26;            // LM35 sensor pin 2 

const int moistureSensorPin = 34;   // Moisture sensor pin
const int servoControlPin = 22;     // Servo control pin
const int gasSensorPin = 35;        // Gas sensor pin
const int light1Pin = 5;            // Light 1 pin
const int light2Pin = 18;           // Light 2 pin
const int light3Pin = 19;           // Light 3 pin
const int light4Pin = 23;           // Light 4 pin
//const int gasBuzzerPin = 22;        // Buzzer pin for high gas levels
// Define the pins for the motor driver connections
const int fan1Pin1 = 4;  // Connect to IN1 of motor driver
const int fan1Pin2 = 17; // Connect to IN2 of motor driver
const int fan2Pin1 = 32; // Connect to IN3 of motor driver
const int fan2Pin2 = 25; // Connect to IN4 of motor driver
const int waterPin = 14;

Servo servoMotor;  // Create a servo object

bool doorMoved = false;

void setup() { 
  pinMode(doorPirSensorPin, INPUT);    // Set the door PIR sensor pin as input 
  pinMode(roomPirSensorPin1, INPUT);    // Set the room PIR sensor pin as input 
  pinMode(roomPirSensorPin2, INPUT);    // Set the room PIR sensor pin as input 
  pinMode(doorBuzzerPin, OUTPUT);      // Set the buzzer pin for door PIR as output 
  pinMode(roomBuzzerPin, OUTPUT);      // Set the buzzer pin for room PIR as output 
//  pinMode(room1LdrPin, INPUT);         // Set the LDR pin for room 1 as input 
  pinMode(room2LdrPin, INPUT);         // Set the LDR pin for room 2 as input 
  pinMode(room1LedPin, OUTPUT);        // Set the LED pin for room 1 as output 
  pinMode(room2LedPin, OUTPUT);        // Set the LED pin for room 2 as output 
  //pinMode(lm35Pin2, INPUT);            // Set the LM35 sensor pin 2 as input 
  pinMode(moistureSensorPin, INPUT);   // Set the moisture sensor pin as input
  pinMode(servoControlPin, OUTPUT);   // Set the servo control pin as output
  pinMode(gasSensorPin, INPUT);       // Set the gas sensor pin as input
  pinMode(light1Pin, OUTPUT);         // Set the light 1 pin as output
  pinMode(light2Pin, OUTPUT);         // Set the light 2 pin as output
  pinMode(light3Pin, OUTPUT);         // Set the light 3 pin as output
  pinMode(light4Pin, OUTPUT);         // Set the light 4 pin as output
  //pinMode(gasBuzzerPin, OUTPUT);      // Set the buzzer pin for high gas levels

   // Set motor driver pins as output
  pinMode(fan1Pin1, OUTPUT);
  pinMode(fan1Pin2, OUTPUT);
  pinMode(fan2Pin1, OUTPUT);
  pinMode(fan2Pin2, OUTPUT);
  pinMode(waterPin, OUTPUT);
  dht.begin();
  servoMotor.attach(servoControlPin); // Attach the servo to its pin
  
  Serial.begin(9600); // Initialize serial communication
  connectToWiFi();      // Connect to WiFi
}

unsigned long lastRoomActivityTime = 0; // Variable to store the time of last room activity
const unsigned long inactiveTimeout = 30000; // 30 seconds in milliseconds

unsigned long doorBuzzerStartTime = 0;
unsigned long roomBuzzerStartTime = 0;

const unsigned long doorBuzzerDuration = 10000; // Duration for the door buzzer
const unsigned long roomBuzzerDuration = 10000; // Duration for the room buzzer

int roomSensorValue;
int count = 0;
void loop() {
  String readValues = readData("AH2");

  int doorSensorValue = digitalRead(doorPirSensorPin);
  int roomSensorValue1 = digitalRead(roomPirSensorPin1);
  int roomSensorValue2 = digitalRead(roomPirSensorPin2);

  Serial.print("Door PIR: ");
  Serial.println(doorSensorValue);
  Serial.print("Room PIR: ");
  Serial.println(roomSensorValue1);
  Serial.print("Room PIR: ");
  Serial.println(roomSensorValue2);

  if(roomSensorValue1 == 1)
    roomSensorValue = 1;
  
  else if(roomSensorValue2 == 1)
    roomSensorValue = 1;
  else
    roomSensorValue = 0;
  

  if(doorSensorValue == HIGH){
    doorSensorValue = 1;
  }
  else{
    doorSensorValue = 0;
  }

  int temp1 = lm35Pin1;       // Read LM35 sensor 1 value
  //int temp2 = analogRead(lm35Pin2);       // Read LM35 sensor 2 value
  float temp2 = dht.readTemperature();
  int moistureValue = analogRead(moistureSensorPin); // Read moisture sensor value
  moistureValue = 100 - 100*moistureValue/4096;

  // Loop through the characters of the readValues string 
  int array[25]; 
  int h = 0; 
  String s1 = "";

  //  Adding the values to array (Very important code)
  for (int i = 0; i < readValues.length(); i++) {
      char currentChar = readValues[i];

      if (currentChar == '*') {
          continue;
      } else if (currentChar == 'T') {
          array[h] = 1;
          //Serial.println(String(h)+", "+String(array[h]));
          i = i + 4;
          h++;
      } else if (currentChar == 'F') {
          array[h] = 0;
          //Serial.println(String(h)+", "+String(array[h]));
          h++;
          i = i + 5;
      } else if (currentChar == '#') {
          break;
      } else {
          s1 += currentChar;
          // Check if the next character is '*' or '#'
          if (i + 1 < readValues.length() && (readValues[i + 1] == '*' || readValues[i + 1] == '#')) {
              array[h] = s1.toInt();
              h++;
              s1 = ""; // Reset s1 for the next number
          }
      }
  }
  Serial.println("Values");
  
int b2Value = array[0];
int h2Value = array[6];
int c2Value = array[1];
int d2Value = array[2];
int e2Value = array[3];
int k2Value = array[9];
int l2Value = array[10];
int m2Value = array[11];
int n2Value = array[12];
int q2Value = array[13];
int r2Value = array[14];

int i2Value = array[7];
int j2Value = array[8];
int s2Value = array[15];
int t2Value = array[16];
int z2Value = array[19];
int aa2Value = array[20];
int ab2Value = array[21];
int ac2Value = array[22];
int ad2Value = array[23];
int ae2Value = array[24];

int f2Value = array[4];
int g2Value = array[5];
int v2Value = array[17];
int w2Value = array[18];

// Add Serial.print commands below each variable assignment
Serial.print("b2Value: ");
Serial.println(b2Value);

Serial.print("h2Value: ");
Serial.println(h2Value);

Serial.print("c2Value: ");
Serial.println(c2Value);

Serial.print("d2Value: ");
Serial.println(d2Value);

Serial.print("e2Value: ");
Serial.println(e2Value);

Serial.print("k2Value: ");
Serial.println(k2Value);

Serial.print("l2Value: ");
Serial.println(l2Value);

Serial.print("m2Value: ");
Serial.println(m2Value);

Serial.print("n2Value: ");
Serial.println(n2Value);

Serial.print("q2Value: ");
Serial.println(q2Value);

Serial.print("r2Value: ");
Serial.println(r2Value);

Serial.print("i2Value: ");
Serial.println(i2Value);

Serial.print("j2Value: ");
Serial.println(j2Value);

Serial.print("s2Value: ");
Serial.println(s2Value);

Serial.print("t2Value: ");
Serial.println(t2Value);

Serial.print("z2Value: ");
Serial.println(z2Value);

Serial.print("aa2Value: ");
Serial.println(aa2Value);

Serial.print("ab2Value: ");
Serial.println(ab2Value);

Serial.print("ac2Value: ");
Serial.println(ac2Value);

Serial.print("ad2Value: ");
Serial.println(ad2Value);

Serial.print("ae2Value: ");
Serial.println(ae2Value);

Serial.print("f2Value: ");
Serial.println(f2Value);

Serial.print("g2Value: ");
Serial.println(g2Value);

Serial.print("v2Value: ");
Serial.println(v2Value);

Serial.print("w2Value: ");
Serial.println(w2Value);

    while(1){
      if(count == 0){
        count++;
        if(f2Value != temp1){
          sendData("F2", String(temp2));
          sendData("G2", String(temp2));
          break;
        }
        
      }

      /*if(count == 1){
        if(g2Value != temp2){
          sendData("G2", String(temp2));
          break;
        }
        count++;
      }*/

      if(count == 1){
        count++;
        int gasSensorValue = 100*analogRead(gasSensorPin)/4095; // Read gas sensor value
        if(v2Value != gasSensorValue){
          sendData("V2", String(gasSensorValue));
          break;
        }
        
      }

      if(count == 2){
        count++;
        Serial.println(1);
        if(w2Value != moistureValue){
          sendData("W2", String(moistureValue));
          break;
        }
      }

      if(count == 3){
        count++;
        if(q2Value != doorSensorValue){
          if(doorSensorValue){
            sendData("Q2", "TRUE");
          }
          else{
            sendData("Q2", "FALSE");
          }
          break;
        }
      }

      if(count == 4){
        count = 0;
        if(r2Value != roomSensorValue){
          if(roomSensorValue){
            sendData("R2", "TRUE");
          }
          else{
            sendData("R2", "FALSE");
          }
          break; 
        }
      }

      break;
    }
  
    // Vout = (10 mV/°C) * temperature
    float temperature1 = (temp1 / 10.0); // Assuming lm35Value1 is already defined
    float temperature2 = (temp2 / 10.0); // Assuming lm35Value2 is already defined
  
  // Control fan for room 1
  if (b2Value == 1) {
    if (d2Value == 0) {
      // Turn on fan for room 1
      digitalWrite(fan1Pin1, HIGH);
      digitalWrite(fan1Pin2, LOW);
    } else {
      // Check temperature threshold for room 1
      if (temperature2 >h2Value) { 
        // Turn on fan for room 1
        digitalWrite(fan1Pin1, HIGH);
        digitalWrite(fan1Pin2, LOW);
      } else {
        // Turn off fan for room 1
        digitalWrite(fan1Pin1, LOW);
        digitalWrite(fan1Pin2, LOW);
      }
    }
  } else {
    // Turn off fan for room 1
    digitalWrite(fan1Pin1, LOW);
    digitalWrite(fan1Pin2, LOW);
  }

  // Control fan for room 2
  Serial.println("F1");
  if (c2Value == 1) {
    Serial.println("F2");
    if (e2Value == 0) {
      Serial.println("F3");
      // Turn on fan for room 2
      digitalWrite(fan2Pin1, HIGH);
      digitalWrite(fan2Pin2, LOW);
    } else {
      // Check temperature threshold for room 2
      if (temperature2 > h2Value) { 
        // Turn on fan for room 2
        digitalWrite(fan2Pin1, HIGH);
        digitalWrite(fan2Pin2, LOW);
      } else {
        // Turn off fan for room 2
        digitalWrite(fan2Pin1, LOW);
        digitalWrite(fan2Pin2, LOW);
      }
    }
  } else {
    // Turn off fan for room 2
    digitalWrite(fan2Pin1, LOW);
    digitalWrite(fan2Pin2, LOW);
  }
  
  if (ac2Value == 1) {
    servoMotor.write(110);
    Serial.println("OPEN");
  } else if (ac2Value == 0) {
      servoMotor.write(0);
      Serial.println("CLOSE");
  }
  
  
  Serial.print("Temperature 1: ");
  Serial.print(temperature1);
  Serial.println(" °C");
  Serial.print("Temperature 2: ");
  Serial.print(temperature2*10);
  Serial.println(" °C");
  
  Serial.print("Moisture Sensor: ");
  Serial.println(moistureValue);
  //int room1LdrValue = analogRead(room1LdrPin);  // Read LDR value for room 1
  int room2LdrValue = analogRead(room2LdrPin);  // Read LDR value for room 2
  if (i2Value == 1) {
    // Turn on room 1 LED if LDR value is 0, otherwise turn it off
    if (k2Value == 1) {
      // If sensor doesn't detect anything, check for inactive timeout
      if (millis() - lastRoomActivityTime >= inactiveTimeout) {
        lastRoomActivityTime = 0;
        //If the inactive timeout has elapsed, turn off the room lights
        digitalWrite(room2LedPin, LOW);
      }
      else if (room2LdrValue == 0) { //It should be toom1ldr  
        digitalWrite(room2LedPin, HIGH);  // Turn on LED for room 1
      } else{
        digitalWrite(room2LedPin, LOW);  // Turn on LED for room 1
      }
    } else {
      digitalWrite(room2LedPin, HIGH);   // Turn off LED for room 1
    }
  } else {
    digitalWrite(room2LedPin, LOW);   // Turn off LED for room 1
  }

  if (j2Value == 1) {
    // Turn on room 1 LED if LDR value is 0, otherwise turn it off
    
    if (l2Value == 1) {
      
      // If sensor doesn't detect anything, check for inactive timeout
      if (millis() - lastRoomActivityTime >= inactiveTimeout) {
        lastRoomActivityTime = 0;
        //If the inactive timeout has elapsed, turn off the room lights
        digitalWrite(room1LedPin, LOW);
      }
      else if (room2LdrValue == 0) {
        digitalWrite(room1LedPin, HIGH);  // Turn on LED for room 1
      } else{
        digitalWrite(room1LedPin, LOW);  // Turn on LED for room 1 
      }
      
    } else {
      digitalWrite(room1LedPin, HIGH);   // Turn off LED for room 1
    }
  } else {
    digitalWrite(room1LedPin, LOW);   // Turn off LED for room 1
  }
  
  
  
  if (doorSensorValue == 1) {
    // Turn on the buzzer for the room
    /*
    if(ae2Value == 1){
      Serial.println("ESPCAM!!");
    }*/
    if(m2Value == 1 && doorBuzzerStartTime == 0){
      digitalWrite(doorBuzzerPin, HIGH);
      doorBuzzerStartTime = millis(); // Record the time the buzzer started
    }
  } else{
  }
  if (millis() - doorBuzzerStartTime >= doorBuzzerDuration) {
    digitalWrite(doorBuzzerPin, LOW);  // Turn off the buzzer
    doorBuzzerStartTime = 0;
  }
  
  // Check if the room PIR sensor detects something
  if (roomSensorValue == 1) {
    // If sensor detects something, update the last room activity time
    if(lastRoomActivityTime == 0)
      lastRoomActivityTime = millis();
    
    if(n2Value == 1 && roomBuzzerStartTime == 0){
      // Turn on the buzzer for the room
      digitalWrite(roomBuzzerPin, HIGH);
      roomBuzzerStartTime = millis(); // Record the time the buzzer started
    }
  }

  if (millis() - roomBuzzerStartTime >= roomBuzzerDuration) {
    digitalWrite(roomBuzzerPin, LOW);  // Turn off the buzzer
    roomBuzzerStartTime = 0;
  }
  int gasSensorValue = 100*analogRead(gasSensorPin)/4095;
  Serial.println(gasSensorValue);
  Serial.println(gasSensorValue);
  if(t2Value == 0){
    Serial.println(0);
    digitalWrite(light1Pin, LOW);
    digitalWrite(light2Pin, LOW);
    digitalWrite(light3Pin, LOW);
    digitalWrite(light4Pin, LOW);
  } else if (gasSensorValue < 10) {
    Serial.println(1);
    digitalWrite(light1Pin, HIGH);
    digitalWrite(light2Pin, LOW);
    digitalWrite(light3Pin, LOW);
    digitalWrite(light4Pin, LOW);
  } else if (gasSensorValue < 30) {
    Serial.println(2);
    digitalWrite(light1Pin, LOW);
    digitalWrite(light2Pin, HIGH);
    digitalWrite(light3Pin, LOW);
    digitalWrite(light4Pin, LOW);
  } else if (gasSensorValue < 60) {
    Serial.println(3);
    digitalWrite(light1Pin, LOW);
    digitalWrite(light2Pin, LOW);
    digitalWrite(light3Pin, HIGH);
    digitalWrite(light4Pin, LOW);
  } else {
    Serial.println(4);
    digitalWrite(light1Pin, LOW);
    digitalWrite(light2Pin, LOW);
    digitalWrite(light3Pin, LOW);
    digitalWrite(light4Pin, HIGH);
  }
  if(s2Value == 1 && gasSensorValue >= 60){
    // Activate room buzzer
    digitalWrite(doorBuzzerPin, HIGH);
    doorBuzzerStartTime = millis(); // Record the time the buzzer started
  }
  else{
    if (millis() - doorBuzzerStartTime >= doorBuzzerDuration) {
      digitalWrite(doorBuzzerPin, LOW);  // Turn off the buzzer
      doorBuzzerStartTime = 0;
  }
  }
  int moistureThreshold = 15; // Adjust this threshold according to your requirement
  // Check conditions to control the water pump
  Serial.println("g1");
  if (aa2Value == 1) {
    Serial.println("g2");
    if (ab2Value == 0) {
      // Turn on the water pump
      Serial.println("g3");
      pinMode(waterPin, OUTPUT);
      digitalWrite(waterPin, LOW);
    } else {
      // Check moisture threshold
      if (moistureValue < moistureThreshold) {
        // Turn on the water pump
        pinMode(waterPin, OUTPUT);
        digitalWrite(waterPin, LOW);
        Serial.println(4);
      } else {
        // Turn off the water pump
        digitalWrite(waterPin, LOW);
        pinMode(waterPin, INPUT);
      }
    }
  } else {
    // Turn off the water pump if AA2 is false
    digitalWrite(waterPin, LOW);
    pinMode(waterPin, INPUT);
  }
  
  // Check if Z2 is true and moistureValue is below a threshold
  if (z2Value == 1 && moistureValue < moistureThreshold) {
    // Activate MOISTURE buzzer
    digitalWrite(doorBuzzerPin, HIGH);
    doorBuzzerStartTime = millis(); // Record the time the buzzer started
  }
  else{
    if (millis() - doorBuzzerStartTime >= doorBuzzerDuration) {
      digitalWrite(doorBuzzerPin, LOW);  // Turn off the buzzer
      doorBuzzerStartTime = 0;
  }
  }

}

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password); // Connect to WiFi network
  Serial.print("Waiting for WIFI");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000); // Wait for connection
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP()); // Print ESP32 IP address
} 

String readData(String cell) {
  HTTPClient https;

  // Construct the URL with the cell parameter
  String url = "https://script.google.com/macros/s/key/exec?action=read&cell=" + cell;
  
  // Start the HTTP connection
  https.begin(url);
  https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  // Send GET request and get the response
  int httpResponseCode = https.GET();

  String response;

  // Check if the request was successful
  if (httpResponseCode == HTTP_CODE_OK) {
    // Read the response body
    response = https.getString();
    
    // Parse the JSON response
    DynamicJsonDocument jsonDoc(1024); // Choose the appropriate size for your JSON document
    deserializeJson(jsonDoc, response);
    
    // Extract the value from the JSON object
    String value = jsonDoc["value"];
    
    // Assign the extracted value to the response string
    response = value;
  } else if (httpResponseCode == HTTP_CODE_MOVED_PERMANENTLY || httpResponseCode == HTTP_CODE_FOUND) {
    // If redirected, get the new URL from the location header
    String newUrl = https.header("Location");
    Serial.println("Redirected to: " + newUrl);

    // Retry the request with the new URL
    https.begin(newUrl);
    httpResponseCode = https.GET();
    
    // Check if the request was successful after redirection
    if (httpResponseCode == HTTP_CODE_OK) {
      // Read the response body
      response = https.getString();
      
      // Parse the JSON response
      DynamicJsonDocument jsonDoc(1024); // Choose the appropriate size for your JSON document
      deserializeJson(jsonDoc, response);
      
      // Extract the value from the JSON object
      String value = jsonDoc["value"];
      
      // Assign the extracted value to the response string
      response = value;
    } else {
      // Print the error code if request failed
      Serial.print("Error code after redirection: ");
      Serial.println(httpResponseCode);
    }
  } else {
    // Print the error code if request failed
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }

  // End the HTTP connection
  https.end();

  return response;
}


void sendData(String cell, String value) {
  HTTPClient http;
  String url = "https://script.google.com/macros/s/key/exec?action=write";
  String requestBody = "{\"cell\": \"" + cell + "\", \"newValue\": \"" + value + "\"}";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(requestBody);

  http.end();
}
