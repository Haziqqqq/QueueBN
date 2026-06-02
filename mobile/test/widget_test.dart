import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:queuebn/main.dart';
import 'package:queuebn/models/department.dart';
import 'package:queuebn/providers/providers.dart';
import 'package:queuebn/providers/queue_providers.dart';

void main() {
  testWidgets('Home screen boots and renders without network', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          departmentsProvider.overrideWith((ref) async => <Department>[]),
        ],
        child: const QueueBNApp(),
      ),
    );
    await tester.pump();

    expect(find.text('QueueBN'), findsWidgets);
  });
}
