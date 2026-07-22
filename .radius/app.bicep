extension radius

param environment string

@secure()
param mysqlPassword string

resource todoListApp 'Radius.Core/applications@2025-08-01-preview' = {
  name: 'todo-list-app-nj'
  properties: {
    environment: environment
  }
}

resource mysqlDb 'Radius.Data/mySqlDatabases@2025-08-01-preview' = {
  name: 'mysql'
  properties: {
    environment: environment
    application: todoListApp.id
    codeReference: 'src/persistence/mysql.js#L31'
    username: 'myadmin'
    password: mysqlPassword
    database: 'todos'
    version: '8.0'
  }
}

resource todoListImage 'Radius.Compute/containerImages@2025-08-01-preview' = {
  name: 'todo-list-app-nj-image'
  properties: {
    environment: environment
    application: todoListApp.id
    codeReference: 'Dockerfile#L1'
    build: {
      source: 'git::https://github.com/nicolejms/todo-list-app-nj.git?ref=5a6fbf5caf982f1d928fe6c1c32aa74f1e95e063'
    }
  }
}

resource todoListContainer 'Radius.Compute/containers@2025-08-01-preview' = {
  name: 'todo-list-app-nj'
  properties: {
    environment: environment
    application: todoListApp.id
    codeReference: 'src/index.js#L17'
    containers: {
      todoList: {
        image: todoListImage.properties.imageReference
        ports: {
          web: {
            containerPort: 3000
          }
        }
        env: {
          MYSQL_HOST: {
            value: mysqlDb.properties.host
          }
          MYSQL_USER: {
            value: 'myadmin'
          }
          MYSQL_PASSWORD: {
            value: mysqlPassword
          }
          MYSQL_DB: {
            value: 'todos'
          }
        }
      }
    }
  }
}
