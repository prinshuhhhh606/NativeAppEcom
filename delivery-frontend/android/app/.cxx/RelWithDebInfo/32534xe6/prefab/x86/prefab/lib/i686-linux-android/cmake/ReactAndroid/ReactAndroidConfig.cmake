if(NOT TARGET ReactAndroid::hermestooling)
add_library(ReactAndroid::hermestooling SHARED IMPORTED)
set_target_properties(ReactAndroid::hermestooling PROPERTIES
    IMPORTED_LOCATION "C:/Users/pr452/.gradle/caches/9.4.1/transforms/7e0f1a573794f8bc9f29ec7be0990376/transformed/react-android-0.88.1-release/prefab/modules/hermestooling/libs/android.x86/libhermestooling.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/pr452/.gradle/caches/9.4.1/transforms/7e0f1a573794f8bc9f29ec7be0990376/transformed/react-android-0.88.1-release/prefab/modules/hermestooling/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::jsi)
add_library(ReactAndroid::jsi SHARED IMPORTED)
set_target_properties(ReactAndroid::jsi PROPERTIES
    IMPORTED_LOCATION "C:/Users/pr452/.gradle/caches/9.4.1/transforms/7e0f1a573794f8bc9f29ec7be0990376/transformed/react-android-0.88.1-release/prefab/modules/jsi/libs/android.x86/libjsi.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/pr452/.gradle/caches/9.4.1/transforms/7e0f1a573794f8bc9f29ec7be0990376/transformed/react-android-0.88.1-release/prefab/modules/jsi/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::reactnative)
add_library(ReactAndroid::reactnative SHARED IMPORTED)
set_target_properties(ReactAndroid::reactnative PROPERTIES
    IMPORTED_LOCATION "C:/Users/pr452/.gradle/caches/9.4.1/transforms/7e0f1a573794f8bc9f29ec7be0990376/transformed/react-android-0.88.1-release/prefab/modules/reactnative/libs/android.x86/libreactnative.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/pr452/.gradle/caches/9.4.1/transforms/7e0f1a573794f8bc9f29ec7be0990376/transformed/react-android-0.88.1-release/prefab/modules/reactnative/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

