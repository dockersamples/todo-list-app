extension radius
extension containerImages
extension containers

@description('The ID of your Radius Environment. Set automatically by the rad CLI.')
param environment string

@description('The full container image reference to build and push. Must be lowercase.')
param image string

resource app 'Applications.Core/applications@2023-10-01-preview' = {
  name: 'demo'
  properties: {
    environment: environment
  }
}

// Build and push the container image from local source to ghcr.io.
// Registry credentials are configured by the platform engineer via
// TF_VAR_ghcr_* environment variables on the dynamic-rp deployment.
resource demoImage 'Radius.Compute/containerImages@2025-08-01-preview' = {
  name: 'demo-image'
  properties: {
    environment: environment
    application: app.id
    image: image
    build: {
      context: '/app/demo'
    }
  }
}

// Deploy a container using the image built above.
resource demo 'Radius.Compute/containers@2025-08-01-preview' = {
  name: 'demo'
  properties: {
    environment: environment
    application: app.id
    containers: {
      demo: {
        image: demoImage.properties.image
        ports: {
          web: {
            containerPort: 3000
          }
        }
      }
    }
    connections: {
      demoContainerImage: {
        source: demoImage.id
      }
    }
  }
}
