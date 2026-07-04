/**
 * Simple script to test Expo Push Notifications.
 * Send a notification payload with deep linking data to the Expo Push API.
 *
 * Usage:
 *   npx ts-node scripts/send-test-push.ts <EXPO_PUSH_TOKEN> <HABIT_ID>
 */

const args = process.argv.slice(2);
const pushToken = args[0];
const habitId = args[1];

if (!pushToken) {
  console.error('Error: Please provide your Expo Push Token as the first argument.');
  console.log('Example: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
  process.exit(1);
}

if (!habitId) {
  console.error('Error: Please provide a Habit ID as the second argument.');
  process.exit(1);
}

async function sendPushNotification() {
  console.log(`Sending test push notification to: ${pushToken}`);
  console.log(`Deep link target: Habit ID ${habitId}`);

  const message = {
    to: pushToken,
    sound: 'default',
    title: 'Time for your Habit! ☕',
    body: 'This is a test remote push notification. Tap to complete your habit!',
    data: {
      screen: '/habit',
      habitId: Number(habitId)
    }
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const data = await response.json();
    console.log('Response from Expo server:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Push notification sent successfully!');
    } else {
      console.error('❌ Failed to send push notification.');
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
  }
}

sendPushNotification();
