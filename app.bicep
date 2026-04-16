extension radius
extension containers
extension mySqlDatabases
extension secrets
extension containerImages

param environment string

@secure()
param password string

@description('The full container image reference to build and push. Must be lowercase.')
param image string

resource todoApp 'Applications.Core/applications@2023-10-01-preview' = {
  name: 'todo-list-app'
  properties: {
    environment: environment
  }
}

resource database 'Radius.Data/mySqlDatabases@2025-08-01-preview' = {
  name: 'mysql'
  properties: {
    environment: environment
    application: todoApp.id
    database: 'todos'
    version: '8.0'
    secretName: dbSecret.name
  }
}

resource dbSecret 'Radius.Security/secrets@2025-08-01-preview' = {
  name: 'dbsecret'
  properties: {
    environment: environment
    application: todoApp.id
    data: {
      USERNAME: {
        value: 'todoappuser'
      }
      PASSWORD: {
        value: password
      }
    }
  }
}

// Build and push the container image from local source to ghcr.io.
// Registry credentials are configured by the platform engineer via
// TF_VAR_ghcr_* environment variables on the dynamic-rp deployment.
resource demoImage 'Radius.Compute/containerImages@2025-08-01-preview' = {
  name: 'demo-image'
  properties: {
    environment: environment
    application: todoApp.id
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
    application: todoApp.id
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
      mysqldb: {
        source: database.id
      }
    }
  }
}
