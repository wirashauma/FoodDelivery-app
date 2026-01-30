class Message {
  final String id;
  final String orderId;
  final String senderId;
  final String receiverId;
  final String content;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? sender;
  final Map<String, dynamic>? receiver;

  Message({
    required this.id,
    required this.orderId,
    required this.senderId,
    required this.receiverId,
    required this.content,
    this.isRead = false,
    required this.createdAt,
    this.sender,
    this.receiver,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      senderId: json['senderId'] ?? '',
      receiverId: json['receiverId'] ?? '',
      content: json['content'] ?? '',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      sender: json['sender'],
      receiver: json['receiver'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'senderId': senderId,
      'receiverId': receiverId,
      'content': content,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
      'sender': sender,
      'receiver': receiver,
    };
  }

  String get senderName => sender?['name'] ?? 'Unknown';
  String get receiverName => receiver?['name'] ?? 'Unknown';
}
