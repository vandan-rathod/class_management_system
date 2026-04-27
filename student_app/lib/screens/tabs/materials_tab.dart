import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/app_models.dart';

class MaterialsTab extends StatefulWidget {
  final String rollNumber; 
  final String parentId; 
  final String folderName;

  const MaterialsTab({
    super.key, 
    required this.rollNumber,
    this.parentId = 'root', 
    this.folderName = 'Study Materials'
  });

  @override
  State<MaterialsTab> createState() => _MaterialsTabState();
}

class _MaterialsTabState extends State<MaterialsTab> {
  String _searchQuery = '';

  void _markAsSeen(String itemId, List<String> seenBy) {
    if (!seenBy.contains(widget.rollNumber)) {
      FirebaseFirestore.instance.collection('materials').doc(itemId).update({
        'seenBy': FieldValue.arrayUnion([widget.rollNumber])
      });
    }
  }

  Future<void> _openLink(BuildContext context, String url) async {
    if (url.trim().isEmpty) return;
    
    String safeUrl = url.trim();
    if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
      safeUrl = 'https://$safeUrl';
    }

    final Uri uri = Uri.parse(safeUrl);
    try {
      final success = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!success) throw 'Failed to launch';
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open this link.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.folderName)),
      body: Column(
        children: [
          // Sleek Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Search in ${widget.folderName}...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.grey.shade100,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          
          // Materials Grid
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('materials')
                  .where('parentId', isEqualTo: widget.parentId)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) return const Center(child: Text('Error loading materials'));
                if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

                final docs = snapshot.data!.docs;
                if (docs.isEmpty) {
                  return const Center(child: Text('This folder is empty.', style: TextStyle(color: Colors.grey)));
                }

                final items = docs.map((d) {
                  Map data = d.data() as Map<String, dynamic>;
                  return {
                    'item': MaterialItem.fromFirestore(d),
                    'seenBy': List<String>.from(data['seenBy'] ?? [])
                  };
                }).toList();
                
                // Sort logically: Folders first, then A-Z
                items.sort((a, b) {
                  final itemA = a['item'] as MaterialItem;
                  final itemB = b['item'] as MaterialItem;
                  if (itemA.type == 'folder' && itemB.type != 'folder') return -1;
                  if (itemA.type != 'folder' && itemB.type == 'folder') return 1;
                  return itemA.title.compareTo(itemB.title);
                });

                // Apply Search Filter
                final filteredItems = items.where((element) {
                  final title = (element['item'] as MaterialItem).title.toLowerCase();
                  return title.contains(_searchQuery.toLowerCase());
                }).toList();

                if (filteredItems.isEmpty) {
                  return Center(
                    child: Text('No results found for "$_searchQuery".', 
                    style: const TextStyle(color: Colors.grey))
                  );
                }

                return GridView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.1,
                  ),
                  itemCount: filteredItems.length,
                  itemBuilder: (context, index) {
                    final itemObj = filteredItems[index]['item'] as MaterialItem;
                    final seenList = filteredItems[index]['seenBy'] as List<String>;
                    final isFolder = itemObj.type == 'folder';

                    return InkWell(
                      onTap: () {
                        _markAsSeen(itemObj.id, seenList);

                        if (isFolder) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => MaterialsTab(
                                rollNumber: widget.rollNumber,
                                parentId: itemObj.id,
                                folderName: itemObj.title,
                              ),
                            ),
                          );
                        } else {
                          _openLink(context, itemObj.link);
                        }
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))
                          ]
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              isFolder ? Icons.folder : Icons.description,
                              size: 54,
                              color: isFolder ? Colors.amber : Colors.blueAccent,
                            ),
                            const SizedBox(height: 12),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12.0),
                              child: Text(
                                itemObj.title,
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}