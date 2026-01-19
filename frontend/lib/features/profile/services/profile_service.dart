import 'dart:async';
import 'package:flutter/material.dart';

class ProfileService {
  static final ProfileService _instance = ProfileService._internal();
  factory ProfileService() => _instance;

  Map<String, dynamic> _simulatedProfileData = {
    'username': 'user_sim',
    'firstName': 'Sim',
    'lastName': 'Ulasi',
    'dateOfBirth': '01-01-2000',
    'email': 'user@mail.com',
    'role': 'user',
  };

  final _profileController =
      StreamController<Map<String, dynamic>>.broadcast();

  ProfileService._internal() {
    _notify();
  }

  void _notify() {
    _profileController.add(_simulatedProfileData);
  }

  Stream<Map<String, dynamic>> get profileStream => _profileController.stream;

  Future<Map<String, dynamic>> getProfile() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _simulatedProfileData;
  }

  Future<void> saveProfile({
    required String username,
    required String firstName,
    required String lastName,
    required String dateOfBirth,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    _simulatedProfileData['username'] = username;
    _simulatedProfileData['firstName'] = firstName;
    _simulatedProfileData['lastName'] = lastName;
    _simulatedProfileData['dateOfBirth'] = dateOfBirth;
    _notify();
    debugPrint('Profil simulasi disimpan: $_simulatedProfileData');
  }

  Future<String> getRole() async {
    await Future.delayed(const Duration(milliseconds: 50));
    return _simulatedProfileData['role'] ?? 'user';
  }

  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 100));
    debugPrint('Simulasi Logout');
  }

  void dispose() {
    _profileController.close();
  }
}