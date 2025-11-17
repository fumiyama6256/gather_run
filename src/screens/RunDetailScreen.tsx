import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Run } from '../types';
import EditRunModal from '../components/EditRunModal';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
};

type RunDetailScreenProps = {
  route: {
    params: {
      runId: string;
      description: string;
      datetime: string;
      location_name: string | null;
      note: string | null;
    };
  };
  navigation: any;
};

export default function RunDetailScreen({ route, navigation }: RunDetailScreenProps) {
  const { runId, description, datetime, location_name, note } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    fetchRun();
    fetchComments();
    fetchCurrentUser();

    // リアルタイム更新を購読
    const channel = supabase
      .channel(`run-${runId}-comments`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          console.log('New comment:', payload.new);
          setComments((prev) => [...prev, payload.new as Comment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId]);

  const fetchRun = async () => {
    try {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (error) throw error;
      setRun(data);
    } catch (error) {
      console.error('Error fetching run:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('エラー', 'コメントを入力してください');
      return;
    }

    if (!userName.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('comments').insert({
        run_id: runId,
        content: newComment.trim(),
        user_name: userName.trim(),
      });

      if (error) throw error;

      setNewComment('');
      Alert.alert('成功', 'コメントを投稿しました！');
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('エラー', 'コメントの投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      'この投稿を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('runs')
                .delete()
                .eq('id', runId);

              if (error) throw error;

              Alert.alert('成功', '投稿を削除しました', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting run:', error);
              Alert.alert('エラー', '投稿の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleEditSuccess = () => {
    // Runを再取得
    fetchRun();
  };

  const isOwner = run && currentUserId && run.user_id === currentUserId;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView}>
        {/* Run詳細 */}
        <View style={styles.detailCard}>
          <Text style={styles.title}>{run?.description || description}</Text>
          <Text style={styles.datetime}>{new Date(run?.datetime || datetime).toLocaleString('ja-JP')}</Text>
          {(run?.location_name || location_name) && <Text style={styles.location}>{run?.location_name || location_name}</Text>}
          {(run?.note || note) && <Text style={styles.note}>{run?.note || note}</Text>}

          {/* 編集・削除ボタン（自分の投稿のみ表示） */}
          {isOwner && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>削除</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* コメント一覧 */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>コメント ({comments.length})</Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>まだコメントがありません</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <Text style={styles.commentUserName}>{comment.user_name}</Text>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Text style={styles.commentDate}>
                  {new Date(comment.created_at).toLocaleString('ja-JP')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* コメント投稿フォーム */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.nameInput}
          placeholder="名前"
          value={userName}
          onChangeText={setUserName}
          maxLength={50}
        />
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="コメントを入力..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>送信</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 編集モーダル */}
      <EditRunModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        run={run}
        onSuccess={handleEditSuccess}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  datetime: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontStyle: 'italic',
  },
  commentCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  commentContent: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  inputSection: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginRight: 10,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
