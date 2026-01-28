class Complaint {
  final int id;
  final String type; // 'USER' or 'DELIVERER'
  final String subject;
  final String message;
  final String status; // 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
  final String priority; // 'LOW', 'MEDIUM', 'HIGH'
  final int? orderId;
  final Reporter reporter;
  final List<ComplaintResponse> responses;
  final DateTime createdAt;
  final DateTime updatedAt;

  Complaint({
    required this.id,
    required this.type,
    required this.subject,
    required this.message,
    required this.status,
    required this.priority,
    this.orderId,
    required this.reporter,
    required this.responses,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'],
      type: json['type'] ?? 'USER',
      subject: json['subject'] ?? '',
      message: json['message'] ?? '',
      status: json['status'] ?? 'PENDING',
      priority: json['priority'] ?? 'MEDIUM',
      orderId: json['order_id'],
      reporter: Reporter.fromJson(json['reporter'] ?? {}),
      responses: (json['responses'] as List<dynamic>?)
              ?.map((r) => ComplaintResponse.fromJson(r))
              .toList() ??
          [],
      createdAt: DateTime.parse(
          json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(
          json['updated_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  String get statusText {
    switch (status) {
      case 'PENDING':
        return 'Menunggu';
      case 'IN_PROGRESS':
        return 'Diproses';
      case 'RESOLVED':
        return 'Selesai';
      case 'REJECTED':
        return 'Ditolak';
      default:
        return status;
    }
  }

  String get priorityText {
    switch (priority) {
      case 'LOW':
        return 'Rendah';
      case 'MEDIUM':
        return 'Sedang';
      case 'HIGH':
        return 'Tinggi';
      default:
        return priority;
    }
  }
}

class Reporter {
  final int userId;
  final String? nama;
  final String? email;

  Reporter({
    required this.userId,
    this.nama,
    this.email,
  });

  factory Reporter.fromJson(Map<String, dynamic> json) {
    return Reporter(
      userId: json['user_id'] ?? 0,
      nama: json['nama'],
      email: json['email'],
    );
  }
}

class ComplaintResponse {
  final int id;
  final String message;
  final String? adminName;
  final DateTime createdAt;

  ComplaintResponse({
    required this.id,
    required this.message,
    this.adminName,
    required this.createdAt,
  });

  factory ComplaintResponse.fromJson(Map<String, dynamic> json) {
    return ComplaintResponse(
      id: json['id'],
      message: json['message'] ?? '',
      adminName: json['admin']?['nama'],
      createdAt: DateTime.parse(
          json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}
