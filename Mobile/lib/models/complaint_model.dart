class Complaint {
  final String id;
  final String orderId;
  final String userId;
  final String title;
  final String description;
  final String status;
  final String? response;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? resolvedAt;
  final Map<String, dynamic>? order;
  final Map<String, dynamic>? user;

  Complaint({
    required this.id,
    required this.orderId,
    required this.userId,
    required this.title,
    required this.description,
    required this.status,
    this.response,
    required this.createdAt,
    this.updatedAt,
    this.resolvedAt,
    this.order,
    this.user,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      userId: json['userId'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] ?? 'PENDING',
      response: json['response'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'])
          : null,
      order: json['order'],
      user: json['user'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'userId': userId,
      'title': title,
      'description': description,
      'status': status,
      'response': response,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'resolvedAt': resolvedAt?.toIso8601String(),
      'order': order,
      'user': user,
    };
  }

  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'Menunggu';
      case 'IN_PROGRESS':
        return 'Sedang Diproses';
      case 'RESOLVED':
        return 'Selesai';
      case 'REJECTED':
        return 'Ditolak';
      default:
        return status;
    }
  }

  bool get isPending => status == 'PENDING';
  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isResolved => status == 'RESOLVED';
  bool get isRejected => status == 'REJECTED';

  // Alias for response - used in screens
  String? get adminResponse => response;
}
