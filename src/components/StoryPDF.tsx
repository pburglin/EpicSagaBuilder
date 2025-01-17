import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Story, Message } from '../types';

interface StoryPDFProps {
  story: Story;
  messages: Message[];
  authors: Array<{id: string; username: string; avatarUrl?: string}>;
  showPlayerCharacters: boolean;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20
  },
  heading: {
    fontSize: 18,
    marginBottom: 10
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5
  },
  message: {
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'column'
  }
});

const parseMessageContent = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed.text) {
      return parsed;
    }
  } catch {
    // Not JSON, return as-is
  }
  return { text: content };
};

export const StoryPDF = ({ story, messages, authors, showPlayerCharacters }: StoryPDFProps) => {
  // Split messages into chunks for pagination
  const messageChunks = [];
  const chunkSize = 15;
  const filteredMessages = messages
    .filter(message => showPlayerCharacters || message.type === 'narrator');
  
  for (let i = 0; i < filteredMessages.length; i += chunkSize) {
    messageChunks.push(filteredMessages.slice(i, i + chunkSize));
  }

  return (
    <Document>
      {messageChunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} style={styles.page}>
          {/* Page Header */}
          <View style={{ position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center' }}>
            <Text style={{ fontSize: 10, color: '#666' }}>{story?.title}</Text>
          </View>

          {/* Page Footer */}
          <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center' }}>
            <Text style={{ fontSize: 10, color: '#666' }} render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber} of ${totalPages}`
            )} fixed />
          </View>

          {/* Only show metadata on first page */}
          {pageIndex === 0 && (
            <>
              <View style={styles.section}>
                <Text style={styles.title}>{story?.title}</Text>
                <Text style={styles.text}>{story?.description}</Text>
              </View>

              {/* Authors Section */}
              <View style={styles.section}>
                <Text style={styles.heading}>Contributing Authors</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {authors.map((author, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      {author.avatarUrl && (
                        <Image
                          src={author.avatarUrl}
                          style={{ width: 20, height: 20, borderRadius: 10 }}
                        />
                      )}
                      <Text style={styles.text}>{author.username}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.heading}>Main Quest</Text>
                <Text style={styles.text}>{story?.mainQuest}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.heading}>Starting Scene</Text>
                <Text style={styles.text}>{story?.startingScene}</Text>
              </View>

              <Text style={styles.heading}>Story Chronicle</Text>
            </>
          )}

          {/* Messages Section */}
          <View style={styles.section}>
            {chunk.map((message) => {
              const content = parseMessageContent(message.content);
              const truncatedText = content.text.length > 1000
                ? content.text.substring(0, 1000)
                : content.text;
              
              const imageUrl = content.imageUrl || content.image_url || content.image
                ? content.imageUrl || content.image_url || content.image
                : `https://image.pollinations.ai/prompt/anime style ${truncatedText}`;

              return (
                <View key={message.id} style={styles.message}>
                  <Text style={styles.text}>
                    {message.type === 'narrator'
                      ? content.text
                      : `${story?.characters.find(c => c.id === message.characterId)?.name}: ${content.text}`
                    }
                  </Text>
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      style={{ width: '50%', marginTop: 10 }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </Page>
      ))}
    </Document>
  );
};