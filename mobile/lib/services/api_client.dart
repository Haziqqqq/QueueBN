import 'package:dio/dio.dart';

import '../config/app_config.dart';

/// A user-friendly error raised by the API layer.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

/// Wraps Dio with QueueBN's base URL, timeouts, and error normalization.
class ApiClient {
  ApiClient({Dio? dio})
    : dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: AppConfig.apiBaseUrl,
              connectTimeout: AppConfig.requestTimeout,
              receiveTimeout: AppConfig.requestTimeout,
              sendTimeout: AppConfig.requestTimeout,
              contentType: Headers.jsonContentType,
            ),
          );

  final Dio dio;

  /// Converts a [DioException] into a readable [ApiException].
  ApiException _normalize(DioException e) {
    // Backend errors look like: { "error": "message" }
    final data = e.response?.data;
    if (data is Map && data['error'] != null) {
      return ApiException(
        data['error'].toString(),
        statusCode: e.response?.statusCode,
      );
    }

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException('The request timed out. Please try again.');
      case DioExceptionType.connectionError:
        return ApiException(
          'Could not reach the server.\n'
          'Make sure the backend is running and reachable at '
          '${AppConfig.apiBaseUrl}.',
        );
      default:
        return ApiException(
          e.response?.statusMessage ?? 'Something went wrong. Please try again.',
          statusCode: e.response?.statusCode,
        );
    }
  }

  Future<Response<T>> get<T>(String path) async {
    try {
      return await dio.get<T>(path);
    } on DioException catch (e) {
      throw _normalize(e);
    }
  }

  Future<Response<T>> post<T>(String path, {Object? data}) async {
    try {
      return await dio.post<T>(path, data: data);
    } on DioException catch (e) {
      throw _normalize(e);
    }
  }

  Future<Response<T>> delete<T>(String path) async {
    try {
      return await dio.delete<T>(path);
    } on DioException catch (e) {
      throw _normalize(e);
    }
  }
}
