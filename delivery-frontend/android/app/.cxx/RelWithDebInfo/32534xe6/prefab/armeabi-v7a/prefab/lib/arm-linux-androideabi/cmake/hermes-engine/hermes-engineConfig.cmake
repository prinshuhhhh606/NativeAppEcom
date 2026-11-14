if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "C:/Users/pr452/.gradle/caches/9.4.1/transforms/cfd1bd50f2ad57d3f01496bd1cd3bc2a/transformed/hermes-android-260318099.0.5-release/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/pr452/.gradle/caches/9.4.1/transforms/cfd1bd50f2ad57d3f01496bd1cd3bc2a/transformed/hermes-android-260318099.0.5-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

