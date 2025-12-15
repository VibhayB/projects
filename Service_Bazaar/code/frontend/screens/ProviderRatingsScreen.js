import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ProviderRatingsScreen = ({ route, navigation }) => {
  const { providerName, comments } = route.params || {};

  const groupCommentsByDate = (comments) => {
    if (!comments || comments.length === 0) return [];

    const grouped = comments.reduce((acc, comment) => {
      const date = new Date(comment.created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(comment);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .map(([date, comments]) => ({ date, comments }));
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#FFD700" : "#ddd"}
          style={styles.star}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        {renderStars(item.rating)}
      </View>
      {item.comment && (
        <Text style={styles.commentText}>"{item.comment}"</Text>
      )}
    </View>
  );

  const renderDateGroup = ({ item }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateHeader}>{item.date}</Text>
      <View style={styles.commentsForDate}>
        {item.comments.map((comment, index) => (
          <View key={index} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              {renderStars(comment.rating)}
            </View>
            {comment.comment && (
              <Text style={styles.commentText}>"{comment.comment}"</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const groupedComments = groupCommentsByDate(comments);

  // Calculate average rating
  const averageRating = comments && comments.length > 0 
    ? (comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length).toFixed(1)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{providerName}</Text>
          <Text style={styles.headerSubtitle}>Ratings & Reviews</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {comments && comments.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.averageRating}>
              <Text style={styles.ratingNumber}>{averageRating}</Text>
              {renderStars(Math.round(averageRating))}
            </View>
            <Text style={styles.totalReviews}>
              {comments.length} review{comments.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}
      
      {groupedComments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={48} color="#ddd" />
          <Text style={styles.noComments}>No ratings yet</Text>
          <Text style={styles.noCommentsSubtext}>
            Be the first to rate this provider
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedComments}
          keyExtractor={(item) => item.date}
          renderItem={renderDateGroup}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryContent: {
    alignItems: 'center',
  },
  averageRating: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  star: {
    marginHorizontal: 1,
  },
  totalReviews: {
    fontSize: 14,
    color: '#6c757d',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
    paddingLeft: 4,
  },
  commentsForDate: {
    gap: 12,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noComments: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
});

export default ProviderRatingsScreen;