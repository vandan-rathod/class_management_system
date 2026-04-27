import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../login_screen.dart';

class ProfileTab extends StatefulWidget {
  final String rollNumber;
  const ProfileTab({super.key, required this.rollNumber});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    DocumentSnapshot doc = await FirebaseFirestore.instance
        .collection('studentDetails')
        .doc(widget.rollNumber)
        .get();

    if (doc.exists) {
      Map data = doc.data() as Map<String, dynamic>;
      setState(() {
        _nameController.text = data['name'] ?? '';
        _phoneController.text = data['phone'] ?? '';
       
      });
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isLoading = true);
    await FirebaseFirestore.instance
        .collection('studentDetails')
        .doc(widget.rollNumber)
        .set({
      'name': _nameController.text.trim(),
      'phone': _phoneController.text.trim(),
      
    }, SetOptions(merge: true));

    setState(() => _isLoading = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile Updated Successfully')),
      );
    }
  }

  void _showUpdateDialog(String title, String label, bool isPassword) {
    final TextEditingController inputController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: inputController,
          obscureText: isPassword,
          decoration: InputDecoration(labelText: label),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              try {
                if (isPassword) {
                  await FirebaseAuth.instance.currentUser?.updatePassword(inputController.text.trim());
                } else {
                  await FirebaseAuth.instance.currentUser?.verifyBeforeUpdateEmail(inputController.text.trim());
                }
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('$title Successful! ${!isPassword ? "Check your new email to verify." : ""}')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: Requires recent login. Please logout and login again.')),
                  );
                }
              }
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  void _logout() async {
    await FirebaseAuth.instance.signOut();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Roll Number: ${widget.rollNumber}', 
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text('Email: ${FirebaseAuth.instance.currentUser?.email ?? "N/A"}', 
                style: const TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center),
            const SizedBox(height: 32),
            
            // Database Details
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            
            
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveProfile,
                child: _isLoading 
                    ? const CircularProgressIndicator() 
                    : const Text('Save Details', style: TextStyle(fontSize: 18)),
              ),
            ),
            const Divider(height: 48, thickness: 2),

            // Authentication Credentials
            const Text('Account Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => _showUpdateDialog('Change Email', 'New Email Address', false),
              child: const Text('Change Email ID'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => _showUpdateDialog('Change Password', 'New Password (min 6 chars)', true),
              child: const Text('Change Password'),
            ),
          ],
        ),
      ),
    );
  }
}