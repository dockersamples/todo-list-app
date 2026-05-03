Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"

  config.vm.provider "virtualbox" do |vb|
    vb.memory = "4096"
    vb.cpus = 2
  end

  config.vm.network "private_network", type: "dhcp"

  config.vm.provision "shell", inline: <<-SHELL
    apt-get update
    apt-get install -y curl docker.io

    systemctl start docker
    systemctl enable docker

    # install kubectl
    curl -LO https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

    # install minikube
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
    install minikube-linux-amd64 /usr/local/bin/minikube

    # start cluster
    minikube start --driver=docker
  SHELL
end
